from dataclasses import dataclass, asdict
import asyncio
import os
from typing import List, Optional, Dict

from supabase import create_client, Client
from realtime._async.client import AsyncRealtimeClient

from dotenv import load_dotenv
load_dotenv('../app/.env')

SUPABASE_URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
SUPABASE_ANON_KEY = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']

supabase : Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

@dataclass
class RequestConfig:
    model_url: str                               # Model URL
    weights: List[float]                         # Model weights
    batch_size: int                              # Micro-batch size
    inputs: List[List[float]] = None             # Input data
    input_shape: List[int] = None                # Input tensor shape
    outputs: Optional[List[List[float]]] = None  # Output data (optional)
    output_shape: Optional[List[int]] = None     # Output tensor shape (optional)
    epochs: Optional[int] = None                 # Training epochs (optional)
    datasets_per_device: Optional[int] = None    # Device batch size (optional)


@dataclass
class ResponseConfig:
    weights: List[List[float]]           # Updated weights
    outputs: Optional[List[List[float]]] # Predictions (optional)
    loss: float                          # Loss value


@dataclass 
class Task:
    '''
    A class to manage tasks broadcasted to the Cactus network. 
    '''
    request_data: RequestConfig
    response_data: Optional[ResponseConfig] = None

    @property
    def is_completed(self) -> bool:
        return self.response_data is not None


class TaskManager:
    '''
    A class to manage each consumer's collection of tasks
    '''
    def __init__(self):
        self.tasks: Dict[int, Task] = {}

    def __repr__(self) -> str:
        task_list = []
        for task_id, task in self.tasks.items():
            status = "complete" if task.is_completed else "incomplete"
            task_list.append(f"Task {task_id}: {status}")
        return "\n".join(task_list)

    def create_task(self, task_id:int, request_data:RequestConfig) -> None:
        if task_id in self.tasks: raise ValueError(f"Task {task_id} already exists.")
        self.tasks[task_id] = Task(request_data=request_data)

    def log_completion(self, task_id:int, response_data:ResponseConfig) -> None:
        if task_id not in self.tasks: raise KeyError(f"Task {task_id} does not exist.")
        self.tasks[task_id].response_data = response_data

    @property
    def completed_tasks(self):
        return {task_id: task for task_id, task in self.tasks.items() if task.is_completed}

    @property
    def incomplete_tasks(self):
        return {task_id: task for task_id, task in self.tasks.items() if not task.is_completed}
    

class Worker:

    def __init__(self, _id):
        # TODO: validate consumer registration and use "real" IDs
        self.id = _id
        self.task_manager = TaskManager()
        asyncio.create_task(self.listen_for_task_completion())

    @property
    def available_devices(self) -> List[int]:
        try:
            response = supabase.table("devices").select("id").eq("status", "available").execute()
            devices = [device["id"] for device in response.data]
            return devices
        except Exception as e:
            print('Unable to load devices (unexpected error): ', e)
            return []
        
    def send_task(self, device_id:int, request_type:str, request_data:RequestConfig) -> None: 
        '''
        Main method that sends a request to a given Ferra-enabled device

        INPUTS:
        - device_id: ID of the device from the public.devices table. Reference self.available_devices 
          (but *dont* run self.available_devices each time because request latency will add up!)
        - request_type: train | evaluate | predict
        - request_data: a RequestConfig object

        OUTPUTS:
        - success <bool>: whether the task was successfully inserted into supabase. Success does not mean completion!!
        '''
        try:
            request_type = 'train'
            response = supabase.table("tasks").insert({
                'device_id': device_id,
                'consumer_id': self.id,
                'request_type': request_type,
                'request_data': asdict(request_data),
            }).execute()
            self.task_manager.create_task(task_id=response.data[0]['id'], request_data=request_data)
            return True
        except Exception as e:
            print(f"Error sending job request: {e}")
            return False

    async def listen_for_task_completion(self):
        client = AsyncRealtimeClient(
            f"{SUPABASE_URL}/realtime/v1",
            SUPABASE_ANON_KEY,
            auto_reconnect=False
        )
        await client.connect()
        channel = client.channel("tasks")
        
        await channel.on_postgres_changes(
          "UPDATE",
          schema="public",
          table="tasks",
          filter=f"consumer_id=eq.{self.id}",
          callback=self._handle_response,
        ).subscribe()
        
        await client.listen()

    def _handle_response(self, payload):
        "Callback to handle responses from the training_tasks table"
        self.task_manager.log_completion(
            task_id=payload['data']['record']['id'],
            response_data=ResponseConfig(**payload['data']['record']['response_data'])
        )