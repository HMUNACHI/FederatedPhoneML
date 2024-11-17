import time
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import requests
import tensorflow as tf
import tf_keras as keras

from cactus.utils import create_device_configs, split_dataset


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
        self.x = (inputs, outputs)
        self._get_available_devices()
        self.device_datasets = split_dataset(inputs, outputs, self.num_devices)

        self.base_config = {
            "epochs": 10,
            "batch_size": batch_size,
            "local_epochs": 5,
        }

        self.device_configs = create_device_configs(
            model, self.base_config, self.device_datasets
        )
        self.validation_inputs = validation_inputs
        self.validation_outputs = validation_outputs

        self.history = {"train_loss": [], "device_losses": [], "val_loss": []}
        print("Training on 4 devices")

    def _get_available_devices(self) -> None:
        """Dummy for now, will actually read from a database or API"""
        device_urls = [
            "http://192.168.1.101:3000",
            "http://192.168.1.102:3000",
            "http://192.168.1.103:3000",
            "http://192.168.1.104:3000",
        ]
        self.device_urls = device_urls
        self.num_devices = len(device_urls)

    def _serialize_weights(self, weights: List[np.ndarray]) -> List:
        """Convert numpy arrays to nested lists for JSON serialization"""
        return [w.tolist() for w in weights]

    def _deserialize_weights(self, weights_data: List) -> List[np.ndarray]:
        """Convert nested lists back to numpy arrays"""
        return [np.array(w) for w in weights_data]

    async def _train_device(
        self, device_url: str, device_config: Dict, is_initial: bool
    ) -> Tuple[Optional[List[np.ndarray]], Optional[float]]:
        """Train on a single device and get weights and loss back"""
        try:
            current_weights = self._serialize_weights(self.model.get_weights())

            if is_initial:
                response = requests.post(
                    f"{device_url}/send-job",
                    json=device_config,
                    headers={"Content-Type": "application/json"},
                )
            else:
                response = requests.post(
                    f"{device_url}/get-weights",
                    json={"weights": current_weights, "config": device_config},
                    headers={"Content-Type": "application/json"},
                )

            response.raise_for_status()
            data = response.json()
            weights = self._deserialize_weights(data["weights"])
            loss = data.get("loss")
            return weights, loss

        except requests.exceptions.RequestException as e:
            print(f"Error training on device {device_url}: {e}")
            return None, None

    def _get_device_predictions(
        self, device_url: str, inputs: np.ndarray, weights: List[np.ndarray]
    ) -> Tuple[Optional[np.ndarray], Optional[float]]:
        """Get predictions and losses from a device"""
        try:
            response = requests.post(
                f"{device_url}/get-inference",
                json={
                    "inputs": inputs.tolist(),
                    "weights": self._serialize_weights(weights),
                },
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
            return np.array(data["predictions"]), data.get("loss")
        except requests.exceptions.RequestException as e:
            print(f"Error getting predictions from {device_url}: {e}")
            return None, None

    def _get_device_evaluation(
        self,
        device_url: str,
        inputs: np.ndarray,
        outputs: np.ndarray,
        weights: List[np.ndarray],
    ) -> Optional[float]:
        """Get evaluation metrics from a device"""
        try:
            response = requests.post(
                f"{device_url}/evaluate",
                json={
                    "inputs": inputs.tolist(),
                    "outputs": outputs.tolist(),
                    "weights": self._serialize_weights(weights),
                },
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            return response.json()["loss"]
        except requests.exceptions.RequestException as e:
            print(f"Error getting evaluation from {device_url}: {e}")
            return None

    def fit(self, epochs):
        """Run federated training process"""
        self._get_available_devices()

        for epoch in range(epochs):
            print(f"Global Epoch {epoch + 1}/{epochs}")
            all_weights = []
            epoch_device_losses = []

            # Train on each device
            for device_id, (device_url, device_config) in enumerate(
                zip(self.device_urls, self.device_configs)
            ):
                print(f"Training on device {device_id + 1}/{self.num_devices}")
                is_initial = epoch == 0
                weights, loss = self._train_device(
                    device_url, device_config, is_initial
                )

                if weights is not None:
                    all_weights.append(weights)
                    if loss is not None:
                        epoch_device_losses.append((loss, len(device_config["inputs"])))

            # Average weights if we got results from any devices
            if all_weights:
                averaged_weights = self.average_model_weights(all_weights)
                self.model.set_weights(averaged_weights)

                # Calculate and store average training loss
                if epoch_device_losses:
                    total_samples = sum(samples for _, samples in epoch_device_losses)
                    avg_train_loss = (
                        sum(loss * samples for loss, samples in epoch_device_losses)
                        / total_samples
                    )
                    self.history["train_loss"].append(avg_train_loss)
                    self.history["device_losses"].append(
                        [loss for loss, _ in epoch_device_losses]
                    )
                    print(f"Average training loss: {avg_train_loss:.4f}")

                # Validate if validation data is provided
                if (
                    self.validation_inputs is not None
                    and self.validation_outputs is not None
                ):
                    val_loss = self.evaluate(
                        self.validation_inputs, self.validation_outputs
                    )
                    self.history["val_loss"].append(val_loss)
                    print(f"Validation loss: {val_loss:.4f}")
            else:
                print("Warning: No weights received from any devices")
                self.history["train_loss"].append(float("inf"))
                self.history["device_losses"].append([])
                if self.validation_inputs is not None:
                    self.history["val_loss"].append(float("inf"))

    def evaluate(
        self,
        inputs: np.ndarray,
        outputs: np.ndarray,
        weights: Optional[List[np.ndarray]] = None,
    ) -> float:
        """Run distributed evaluation across all devices"""
        self._get_available_devices()

        if weights is None:
            weights = self.model.get_weights()

        # Split evaluation data across devices
        input_splits = np.array_split(inputs, self.num_devices)
        output_splits = np.array_split(outputs, self.num_devices)

        all_losses = []
        total_samples = 0

        for device_id, (device_url, device_inputs, device_outputs) in enumerate(
            zip(self.device_urls, input_splits, output_splits)
        ):
            print(f"Evaluating on device {device_id + 1}/{self.num_devices}")
            loss = self._get_device_evaluation(
                device_url, device_inputs, device_outputs, weights
            )
            if loss is not None:
                num_samples = len(device_inputs)
                all_losses.append((loss * num_samples, num_samples))
                total_samples += num_samples

        # Compute weighted average of losses
        if all_losses:
            weighted_loss = sum(loss for loss, _ in all_losses) / total_samples
            return weighted_loss
        return float("inf")

    def predict(self, inputs: np.ndarray) -> Tuple[np.ndarray, Optional[float]]:
        """Run distributed prediction across all devices"""
        return self.model.predict(inputs)
        # self._get_available_devices()

        # input_splits = np.array_split(inputs, self.num_devices)
        # all_predictions = []
        # all_losses = []
        # total_samples = 0

        # current_weights = self.model.get_weights()

        # for device_id, (device_url, device_inputs) in enumerate(
        #     zip(self.device_urls, input_splits)
        # ):
        #     print(f"Getting predictions from device {device_id + 1}/{self.num_devices}")
        #     predictions, loss = self._get_device_predictions(
        #         device_url, device_inputs, current_weights
        #     )
        #     if predictions is not None:
        #         all_predictions.append(predictions)
        #         if loss is not None:
        #             num_samples = len(device_inputs)
        #             all_losses.append((loss * num_samples, num_samples))
        #             total_samples += num_samples

        # if all_predictions:
        #     combined_predictions = np.concatenate(all_predictions)
        #     average_loss = (
        #         (sum(loss for loss, _ in all_losses) / total_samples)
        #         if all_losses
        #         else None
        #     )
        #     return combined_predictions, average_loss

        # raise RuntimeError("No predictions received from any devices")

    def average_model_weights(
        self, all_weights: List[List[np.ndarray]]
    ) -> List[np.ndarray]:
        averaged_weights = []
        for layer_weights in zip(*all_weights):
            avg_layer_weights = np.mean(layer_weights, axis=0)
            averaged_weights.append(avg_layer_weights)
        return averaged_weights

    def get_history(self) -> Dict:
        """Return training history"""
        return self.history
