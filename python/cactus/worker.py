import asyncio
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from dateutil.parser import parse
from dotenv import load_dotenv
from realtime._async.client import AsyncRealtimeClient
from supabase import Client, create_client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
TASK_TIMEOUT = 2  # seconds
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


@dataclass
class RequestConfig:
    modelJson: str
    weights: List[float]
    batchSize: int
    inputs: List[List[float]] = None
    inputShape: List[int] = None
    outputs: Optional[List[List[float]]] = None
    outputShape: Optional[List[int]] = None
    epochs: Optional[int] = None
    datasetsPerDevice: Optional[int] = None


@dataclass
class ResponseConfig:
    weights: List[List[float]]
    outputs: Optional[List[List[float]]] = None
    loss: Optional[float] = None


@dataclass
class Task:
    """
    A class to manage tasks broadcasted to the Cactus network.
    """

    request_data: RequestConfig
    sent_at: datetime
    response_data: Optional[ResponseConfig] = None

    @property
    def is_completed(self) -> bool:
        return self.response_data is not None

    @property
    def is_expired(self) -> bool:
        return (not self.is_completed) and (
            (datetime.now(timezone.utc) - self.sent_at).total_seconds() > TASK_TIMEOUT
        )


class TaskManager:
    """
    A class to manage each consumer's collection of tasks
    """

    def __init__(self):
        self.tasks: Dict[int, Task] = {}

    def __repr__(self) -> str:
        task_list = []
        for task_id, task in self.tasks.items():
            status = "complete" if task.is_completed else "incomplete"
            task_list.append(f"Task {task_id}: {status}")
        return "\n".join(task_list)

    def create_task(
        self, task_id: int, request_data: RequestConfig, sent_at: datetime
    ) -> None:
        if task_id in self.tasks:
            raise ValueError(f"Task {task_id} already exists.")
        self.tasks[task_id] = Task(request_data=request_data, sent_at=sent_at)

    def discard_task(self, task_id: int) -> None:
        del self.tasks[task_id]

    def log_completion(self, task_id: int, response_data: ResponseConfig) -> None:
        if task_id not in self.tasks:
            raise KeyError(f"Task {task_id} does not exist.")
        self.tasks[task_id].response_data = response_data

    @property
    def expired_tasks(self):
        return {
            task_id: task for task_id, task in self.tasks.items() if task.is_expired
        }

    @property
    def completed_tasks(self):
        return {
            task_id: task for task_id, task in self.tasks.items() if task.is_completed
        }

    @property
    def incomplete_tasks(self):
        return {
            task_id: task
            for task_id, task in self.tasks.items()
            if not task.is_completed
        }


class Worker:
    """
    A class to manage the worker's interactions with the Cactus network
    """

    def __init__(self, _id: int) -> None:
        self.id = _id
        self.task_manager = TaskManager()
        self.timeout = False

    def send_task(
        self, device_id: int, request_type: str, request_data: RequestConfig
    ) -> bool:
        """
        Main method that sends a request to a given Ferra-enabled device
        """
        try:
            response = (
                supabase.table("task_requests")
                .insert(
                    {
                        "device_id": device_id,
                        "request_type": request_type,
                        "data": asdict(request_data),
                        "consumer_id": self.id,
                    }
                )
                .execute()
            )

            self.task_manager.create_task(
                task_id=response.data[0]["id"],
                request_data=request_data,
                sent_at=parse(response.data[0]["created_at"]),
            )
            # print(f"Sent task {response.data[0]['id']}")
            return True
        except Exception as e:
            print(f"Error sending job request: {e}")
            return False

    async def _connect_to_realtime(self):
        """
        We subscribe to realtime updates to ALL supabase tables and 
        pass them to the centralized callback function
        """
        client = AsyncRealtimeClient(
            f"{SUPABASE_URL}/realtime/v1", SUPABASE_ANON_KEY, auto_reconnect=False
        )
        await client.connect()
        
        device_channel = client.channel(f"devices")
        task_completion_channel = client.channel(f"task_responses")
        
        self.available_devices = self.load_available_devices()

        await device_channel.on_postgres_changes(
            "UPDATE",
            schema="public",
            table='devices',
            callback=self._device_update_callback,
        ).subscribe()
        
        await task_completion_channel.on_postgres_changes(
            "INSERT",
            schema="public",
            table='task_responses',
            callback=self._task_update_callback,
        ).subscribe()

        self.listener = asyncio.create_task(client.listen())

        # print(f'Worker {self.id} connected to realtime! Available devices: {self.available_devices}')

    async def run(
        self, request_configs: List[RequestConfig], request_type: str
    ) -> None:
        """Multi-device federated learning process"""
        assert request_type in (
            "train",
            "evaluate",
            "predict",
        ), "Unsupported request type!"
        self.request_type = request_type
        self.request_configs = request_configs

        await self._connect_to_realtime()

        try:
            for device_id in self.available_devices:
                if self.request_configs:
                    self.send_task(
                        device_id=device_id,
                        request_type=self.request_type,
                        request_data=self.request_configs[0],
                    )
                    self.request_configs.pop(0)

            while not self.timeout and self.task_manager.incomplete_tasks:
                await asyncio.sleep(0.1)
                await self._check_task_timeouts()

        except Exception as e:
            print(e)
        finally:
            # Cancel the listening task and disconnect cleanly
            self.listener.cancel()

    def load_available_devices(self) -> List[int]:
        "Retrieve devices available at any given point and store them in self.available_devices"
        try:
            response = (
                supabase.table("devices")
                .select("id")
                .eq("status", "available")
                .gte(
                    "last_updated",
                    (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(),
                )
                .execute()
            )
            return [device["id"] for device in response.data]
        except Exception as e:
            print("Unable to load devices (unexpected error): ", e)
            return []

    async def _check_task_timeouts(self):
        """
        Checks whether we have hit timeout
        """
        if self.task_manager.expired_tasks:
            self.timeout = True

    def _task_update_callback(self, payload: Dict) -> None:
        """
        Callback to handle responses from the tasks table. Here, we:

        - parse the incoming payload
        - log completion of the task
        - if there are request_configs remaining (happens when the number of requested configs
          was higher than the initial number of available devices), we send the device that
          completed a task its next request config.
        """
        record = payload.get("data", {}).get("record")
        task_id = record.get("id")
        if task_id in self.task_manager.tasks:
            self.task_manager.log_completion(
                task_id=task_id,
                response_data=ResponseConfig(**record["data"]),
            )
        else:
            print(f"Received task ID not found in my tasks: {task_id}")

    def _device_update_callback(self, payload: Dict) -> None:
        """
        Callback to handle responses from the devices table. Here, we:

        - extract device ID and new status 
        - add it to the list of available devices 
        """
        record = payload.get("data", {}).get("record")
        device_id = record.get("id")
        status = record.get("status")
        if status == "available" and device_id not in self.available_devices:
            self.available_devices.append(device_id)
        elif status == 'unavailable':
            if device_id in self.available_devices:
                self.available_devices.remove(device_id)
            else:
                print(f"received unavailability update for device id {device_id}??")