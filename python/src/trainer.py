from typing import List, Optional, Tuple
from collections import defaultdict

import numpy as np
import tf_keras as keras

from src.worker import Worker, RequestConfig
from src.keras_h5_conversion import save_keras_model

class Trainer:
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
        self.workers = Worker(0)
        self.inputs = inputs
        self.outputs = outputs
        self.validation_inputs = validation_inputs
        self.validation_outputs = validation_outputs
        self.history = defaultdict(list)

    def _get_model_json(self) -> str:
        """Get model JSON string"""
        return self.model.to_json()

    def _create_base_request_config(self, epochs=None) -> RequestConfig:
        """Create base request configuration"""
        return RequestConfig(
            model_url='https://www.cactuscompute.com',
            weights=self._get_weights(),
            batch_size=self.batch_size,
            epochs=epochs,
        )
    
    def _split_dataset(self,
        inputs: np.ndarray, 
        outputs: np.ndarray, 
        devices: int,
    ) -> List[Tuple[np.ndarray, np.ndarray]]:
        """Split dataset into roughly equal parts for each device"""
        total_samples = len(inputs)
        samples_per_device = total_samples // len(devices)
        remainder = total_samples % len(devices)

        datasets = []
        start_idx = 0

        for device in devices:
            current_samples = samples_per_device + (1 if device < remainder else 0)
            end_idx = start_idx + current_samples

            device_inputs = inputs[start_idx:end_idx]

            if outputs is not None:
                device_outputs = outputs[start_idx:end_idx]
                datasets.append((device, device_inputs))
            else:
                datasets.append((device, device_inputs, device_outputs))

            start_idx = end_idx

        return datasets

    def _reset(self):
        """Reset training job data"""
        self.history = defaultdict(list)

    def _get_weights(self) -> List:
        """Convert numpy arrays to nested lists for JSON serialization"""
        return [w.tolist() for w in self.model.get_weights()]

    def _deserialize_weights(self, weights_data: List) -> List[np.ndarray]:
        """Convert nested lists back to numpy arrays"""
        return [np.array(w) for w in weights_data]
    
    def _dispatch(self, request_config: RequestConfig, datasets: List[Tuple[int, np.ndarray, np.ndarray]], request_type: str) -> None:
        """Dispatch tasks to all available devices"""
        for device, device_inputs, device_outputs in datasets:
            request_config.inputs = device_inputs
            request_config.outputs = device_outputs
            request_config.input_shape = list(device_inputs.shape)
            request_config.output_shape = list(device_outputs.shape)
            request_config.datasets_per_device = len(device_inputs)

            self.worker.send_task(
                device_id=device, 
                request_type=request_type, 
                request_data=request_config)
            
    def _average_epoch_loss(self, losses: List[Tuple[float, int]]) -> float:
        """Compute weighted average of losses"""
        total_samples = sum(samples for _, samples in losses)
        average_loss = sum(loss * samples for loss, samples in losses) / total_samples
        return average_loss
    
    def _average_model_weights(
        self, all_weights: List[List[np.ndarray]]
    ) -> List[np.ndarray]:
        averaged_weights = []
        for layer_weights in zip(*all_weights):
            avg_layer_weights = np.mean(layer_weights, axis=0)
            averaged_weights.append(avg_layer_weights)
        return averaged_weights
            
    def _gather(self, request_type: str) -> Tuple[List[np.ndarray], List[Tuple[float, int]]]:
        """Gather results from all devices"""
        all_weights = []
        epoch_device_losses = []
        outputs = []

        for task_id, task in self.worker.tasks.items():
            if task.is_completed:
                if task.response_data.outputs is not None:
                    outputs.append(task.response_data.outputs)
                if task.response_data.weights is not None:
                    all_weights.append(task.response_data.weights)
                if task.response_data.loss is not None:
                    epoch_device_losses.append(
                        (
                            task.response_data.loss, 
                            len(task.request_data.datasets_per_device)
                        )
                    )
            else:
                print(f"Task {task_id} is not completed yet")

        if all_weights:
            averaged_weights = self._average_model_weights(all_weights)
            self.model.set_weights(averaged_weights)

        if epoch_device_losses:
            average_loss = self._average_epoch_loss(epoch_device_losses)
            self.history[f"{request_type}_loss"].append(average_loss)

        return outputs

        

    def fit(self, epochs):
        """Run federated training process"""
        request_config = self._create_base_request_config(epochs)
        datasets = self._split_dataset(self.inputs, self.outputs, self.worker.available_devices())

        for epoch in range(epochs):
            print(f"Global Epoch {epoch + 1}/{epochs}")
            self._dispatch(request_config, datasets, 'train')
            _ = self._gather()

            if (
                self.validation_inputs is not None
                and self.validation_outputs is not None
            ):
                val_loss = self.evaluate()
                self.history["val_loss"].append(val_loss)
                print(f"Validation loss: {val_loss:.4f}")

    def evaluate(self) -> None:
        """Run distributed evaluation across all devices"""
        request_config = self._create_base_request_config()

        datasets = self._split_dataset(
            self.validation_inputs, 
            self.validation_outputs, 
            self.worker.available_devices()
        )

        self._dispatch(request_config, datasets, 'evaluate')

    def predict(self, inputs: np.ndarray) -> Tuple[np.ndarray, Optional[float]]:
        """Run distributed prediction across all devices"""
        request_config = self._create_base_request_config()
        datasets = self._split_dataset(
            inputs, 
            None, 
            self.worker.available_devices()
        )
        self._dispatch(request_config, datasets, 'predict')
        return self._gather('predict')