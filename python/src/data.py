from typing import List, Optional, Tuple

import numpy as np

from .common import DATASET_REPEAT_FACTOR


def validate_dataset(inputs: np.ndarray, outputs: np.ndarray) -> None:
    """Validate dataset shapes"""
    if len(inputs) != len(outputs):
        raise ValueError("Input and output shapes do not match")


def repeat_and_shuffle(
    inputs: np.ndarray, outputs: Optional[np.ndarray] = None
) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """
    Repeat and shuffle dataset. Allows inputs only if outputs are not provided.

    Innovation Motivation:
    - User-managed devices have a high dropout rate in federated learning.
    """
    validate_dataset(inputs, outputs)
    repeated_inputs = np.repeat(inputs, DATASET_REPEAT_FACTOR, axis=0)

    if outputs is not None:
        repeated_outputs = np.repeat(outputs, DATASET_REPEAT_FACTOR, axis=0)
        indices = np.random.permutation(len(repeated_inputs))
        return repeated_inputs[indices], repeated_outputs[indices]
    else:
        indices = np.random.permutation(len(repeated_inputs))
        return repeated_inputs[indices], None


def split_datasets(
    inputs: np.ndarray,
    devices: List[int],
    outputs: np.ndarray = None,
    include_outputs: bool = False,
) -> List[Tuple[int, np.ndarray, np.ndarray]]:
    """Split inputs and outputs into roughly equal parts for each device without truncating data points."""

    inputs, outputs = repeat_and_shuffle(inputs, outputs)

    if outputs is not None:
        validate_dataset(inputs, outputs)

    total_samples = len(inputs)
    num_devices = len(devices)
    samples_per_device = total_samples // num_devices
    remainder = total_samples % num_devices

    datasets = []
    start_idx = 0

    for i, device in enumerate(devices):
        current_samples = samples_per_device + (1 if i < remainder else 0)
        end_idx = start_idx + current_samples
        device_inputs = inputs[start_idx:end_idx]
        device_outputs = None
        if include_outputs:
            device_outputs = outputs[start_idx:end_idx]
        datasets.append(
            (
                device,
                np.array(device_inputs),
                np.array(device_outputs) if include_outputs else None,
            )
        )
        start_idx = end_idx

    return datasets
