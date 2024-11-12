import json
import tempfile
from typing import Any, Dict, List, Tuple

import numpy as np
from cactus.keras_h5_conversion import save_keras_model

from cactus.gcp import upload_to_gcs_and_get_signed_urls


def process_data_for_training(model, inputs, outputs):
    """
    Prepare the model and data for training.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        save_keras_model(model, temp_dir)
        #print(f"Model saved to {temp_dir}")

        tensor_data = {
            "inputs": inputs.tolist(),
            "input_shape": list(inputs.shape),
            "outputs": outputs.tolist(),
            "output_shape": list(outputs.shape),
        }

        dataset_save_path = f"{temp_dir}/datasets.json"
        with open(dataset_save_path, "w") as f:
            json.dump(tensor_data, f)
        #print(f"Datasets saved to {dataset_save_path}")

        return upload_to_gcs_and_get_signed_urls(temp_dir)


def split_dataset(
    inputs: np.ndarray, outputs: np.ndarray, num_devices: int
) -> List[Tuple[np.ndarray, np.ndarray]]:
    """Split dataset into roughly equal parts for each device"""
    total_samples = len(inputs)
    samples_per_device = total_samples // num_devices
    remainder = total_samples % num_devices

    datasets = []
    start_idx = 0

    for device in range(num_devices):
        current_samples = samples_per_device + (1 if device < remainder else 0)
        end_idx = start_idx + current_samples

        device_inputs = inputs[start_idx:end_idx]
        device_outputs = outputs[start_idx:end_idx]

        datasets.append((device_inputs, device_outputs))
        start_idx = end_idx

    return datasets


def create_device_configs(
    model: Any,
    base_config: Dict[str, Any],
    datasets: List[Tuple[np.ndarray, np.ndarray]],
) -> List[Dict[str, Any]]:
    """Create configuration for each device"""
    device_configs = []

    for device_id, (device_inputs, device_outputs) in enumerate(datasets):
        device_config = process_data_for_training(model, device_inputs, device_outputs)
        device_config.update(base_config)
        device_config.update(
            {
                "device_id": device_id,
                "datasets_per_device": len(device_inputs),
            }
        )
        device_configs.append(device_config)

    return device_configs
