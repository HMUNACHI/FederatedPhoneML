import asyncio
import time
from collections import defaultdict
from typing import List, Optional, Tuple

import numpy as np
import tf_keras as keras

from .data import split_datasets
from .federated import average_epoch_loss, average_model_weights
from .keras_h5_conversion import get_keras_model_graph
from .worker import RequestConfig, Worker


class Trainer:
    """Distributed training by using federated training class"""

    def __init__(
        self,
        model: keras.Model,
        inputs: np.ndarray,
        outputs: np.ndarray,
        batch_size: int,
        validation_inputs: Optional[np.ndarray] = None,
        validation_outputs: Optional[np.ndarray] = None,
    ):

        self.model = model
        self.device_urls = None
        self.batch_size = batch_size
        self.worker = Worker(0)
        self.inputs = inputs
        self.outputs = outputs
        self.validation_inputs = validation_inputs
        self.validation_outputs = validation_outputs
        self.history = defaultdict(list)

    def _create_base_request_config(self, epochs=None) -> RequestConfig:
        """Create base request configuration"""
        return RequestConfig(
            modelJson=get_keras_model_graph(self.model),
            weights=self._get_weights(),
            batchSize=self.batch_size,
            epochs=epochs,
        )

    def _reset(self):
        """Reset training job data"""
        self.history = defaultdict(list)

    def _get_weights(self) -> List:
        """Convert numpy arrays to nested lists for JSON serialization"""
        return [w.tolist() for w in self.model.get_weights()]

    def _deserialize_weights(self, weights_data: List) -> List[np.ndarray]:
        """Convert nested lists back to numpy arrays"""
        return [np.array(w) for w in weights_data]

    async def _dispatch(
        self,
        request_config: RequestConfig,
        datasets: List[Tuple[int, np.ndarray, np.ndarray]],
        request_type: str,
    ) -> None:
        """Dispatch tasks to all available devices"""
        for device, device_inputs, device_outputs in datasets:

            request_config.inputs = device_inputs.tolist()
            request_config.outputs = (
                device_outputs.tolist() if device_outputs is not None else None
            )
            request_config.inputShape = list(device_inputs.shape)
            request_config.outputShape = list(device_outputs.shape)
            request_config.datasetsPerDevice = len(device_inputs)

            self.worker.send_task(
                device_id=device, request_type=request_type, request_data=request_config
            )

    def _gather(
        self, request_type: str
    ) -> Tuple[List[np.ndarray], List[Tuple[float, int]]]:
        """Gather results from all devices, update model weights, and compute loss"""
        all_weights = []
        epoch_device_losses = []
        outputs = []

        for task_id, task in list(self.worker.task_manager.tasks.items()):
            print(task.is_completed)
            if task.is_completed:
                if task.response_data.outputs is not None:
                    outputs.append(task.response_data.outputs)
                if task.response_data.weights is not None:
                    all_weights.append(task.response_data.weights)
                if task.response_data.loss is not None:
                    epoch_device_losses.append(
                        (
                            task.response_data.loss,
                            len(task.request_data.datasets_per_device),
                        )
                    )
                del self.worker.task_manager.tasks[task_id]

        if all_weights:
            averaged_weights = average_model_weights(all_weights)
            self.model.set_weights(averaged_weights)

        if epoch_device_losses:
            average_loss = average_epoch_loss(epoch_device_losses)
            self.history[f"{request_type}_loss"].append(average_loss)

        return outputs

    async def _dispatch_gather(self, request_config, datasets, request_type):
        await self._dispatch(request_config, datasets, request_type)
        return self._gather(request_type)

    def fit(self, epochs):
        """Run federated training process"""
        request_config = self._create_base_request_config(epochs)
        print(f"Training on {len(self.worker.available_devices)} devices")

        for epoch in range(epochs):
            print(f"Global Epoch {epoch + 1}/{epochs}")

            datasets = split_datasets(
                self.inputs,
                self.worker.available_devices,
                self.batch_size,
                self.outputs,
                include_outputs=True,
            )

            try:
                _ = asyncio.run(
                    asyncio.wait_for(
                        self._dispatch_gather(request_config, datasets, "fit"),
                        timeout=10,
                    )
                )
            except asyncio.TimeoutError:
                print("Dispatch and gather operation timed out.")
                continue  # Proceed to the next epoch or handle accordingly

            if (
                self.validation_inputs is not None
                and self.validation_outputs is not None
            ):
                _ = self.evaluate()

    def evaluate(self) -> None:
        """Run distributed evaluation across all devices"""
        request_config = self._create_base_request_config()

        datasets = split_datasets(
            self.validation_inputs,
            self.worker.available_devices,
            self.batch_size,
            self.validation_outputs,
            include_outputs=True,
        )

        _ = asyncio.run(self._dispatch_gather(request_config, datasets, "evaluate"))

    def predict(self, inputs: np.ndarray) -> Tuple[np.ndarray, Optional[float]]:
        """Run distributed prediction across all devices"""
        request_config = self._create_base_request_config()
        datasets = split_datasets(inputs, self.worker.available_devices(), self.batch_size)
        return asyncio.run(self._dispatch_gather(request_config, datasets, "predict"))
