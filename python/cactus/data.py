import math
from typing import List, Optional, Tuple

import numpy as np

from .common import DATASET_MINIMUM_REPEAT


def validate_dataset(inputs: np.ndarray, outputs: np.ndarray) -> None:
    """Validate dataset shapes"""
    if len(inputs) != len(outputs):
        raise ValueError("Input and output shapes do not match")


def repeat_and_shuffle(
    inputs: np.ndarray,
    outputs: Optional[np.ndarray] = None,
    num_devices: int = 1,
    batch_size: int = 1,
) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """
    Repeat and shuffle dataset. Allows inputs only if outputs are not provided.

    Innovation Motivation:
    - User-managed devices have a high dropout rate in federated learning.
    - To ensure that a copy of the datapoint exists on another device, the dataset is repeated.
    """
    validate_dataset(inputs, outputs)

    lcm = math.lcm(batch_size, num_devices)

    # Ensure new_size is divisible by both batch_size and (new_size/num_devices)
    repeats = math.ceil((len(inputs) * DATASET_MINIMUM_REPEAT) / lcm)

    # Adjust repeats to ensure divisibility constraints
    def calculate_valid_size(repeats):
        new_size = repeats * lcm
        slice_size = new_size // num_devices
        return (new_size % batch_size == 0) and (slice_size % batch_size == 0)

    # Increment repeats until divisibility conditions are met
    while not calculate_valid_size(repeats):
        repeats += 1

    new_size = repeats * lcm
    slice_size = new_size // num_devices

    assert (
        new_size % batch_size
    ) == 0, f"Dataset size {new_size} must be divisible by the batch size {batch_size}."
    assert (
        slice_size % batch_size
    ) == 0, f"Dataset slice size {slice_size} must also be divisible by the batch_size {batch_size}."

    repeated_inputs = np.repeat(inputs, repeats, axis=0)[:new_size]

    if outputs is not None:
        repeated_outputs = np.repeat(outputs, repeats, axis=0)[:new_size]
        indices = np.random.permutation(new_size)
        return repeated_inputs[indices], repeated_outputs[indices]
    else:
        indices = np.random.permutation(new_size)
        return repeated_inputs[indices], None


def split_datasets(
    inputs: np.ndarray,
    devices: List[int],
    batch_size: int,
    outputs: np.ndarray = None,
    include_outputs: bool = False,
) -> List[Tuple[int, np.ndarray, np.ndarray]]:
    """Split inputs and outputs into roughly equal parts for each device without truncating data points."""

    num_devices = len(devices)
    assert num_devices > 0, "No devices available for training."
    inputs, outputs = repeat_and_shuffle(inputs, outputs, num_devices, batch_size)

    if outputs is not None:
        validate_dataset(inputs, outputs)

    total_samples = len(inputs)

    if num_devices == 0:
        raise ValueError("No device available for training.")

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
