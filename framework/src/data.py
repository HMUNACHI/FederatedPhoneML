import math
from typing import List, Optional, Tuple

import numpy as np

# from .common import DATASET_MINIMUM_REPEAT  # Removed since repetition is no longer needed


def validate_dataset(inputs: np.ndarray, outputs: np.ndarray) -> None:
    """Validate that inputs and outputs have the same number of samples."""
    if outputs is not None and len(inputs) != len(outputs):
        raise ValueError("Input and output shapes do not match")


def repeat_and_shuffle(
    inputs: np.ndarray,
    outputs: Optional[np.ndarray] = None,
    num_devices: int = 1,
    batch_size: int = 1,
) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """
    Shuffle the dataset without repeating.

    Args:
        inputs (np.ndarray): Input data.
        outputs (Optional[np.ndarray]): Output data. Can be None.
        num_devices (int): Number of devices to split the data across. (Unused in shuffling)
        batch_size (int): Size of each batch. (Unused in shuffling)

    Returns:
        Tuple[np.ndarray, Optional[np.ndarray]]: Shuffled inputs and outputs.
    """
    validate_dataset(inputs, outputs)

    if not isinstance(inputs, np.ndarray):
        inputs = np.array(inputs)
    if outputs is not None and not isinstance(outputs, np.ndarray):
        outputs = np.array(outputs)

    new_size = len(inputs)
    indices = np.random.permutation(new_size)

    if not isinstance(indices, np.ndarray) or indices.dtype.kind not in {'i', 'u'} or indices.ndim != 1:
        raise TypeError("Indices must be a one-dimensional array of integers.")

    try:
        shuffled_inputs = inputs[indices]
    except Exception as e:
        raise TypeError(f"Error shuffling inputs: {e}")

    if outputs is not None:
        try:
            shuffled_outputs = outputs[indices]
        except Exception as e:
            raise TypeError(f"Error shuffling outputs: {e}")
    else:
        shuffled_outputs = None

    return shuffled_inputs, shuffled_outputs


def split_datasets(
    inputs: np.ndarray,
    devices: List[int],
    outputs: Optional[np.ndarray] = None,
    include_outputs: bool = False,
) -> List[Tuple[int, np.ndarray, Optional[np.ndarray]]]:
    """
    Shuffle and split inputs and outputs into roughly equal parts for each device without truncating data points.

    Args:
        inputs (np.ndarray): Input data.
        devices (List[int]): List of device identifiers.
        batch_size (int): Size of each batch. (Unused in splitting)
        outputs (Optional[np.ndarray], optional): Output data. Defaults to None.
        include_outputs (bool, optional): Whether to include outputs in the split. Defaults to False.

    Returns:
        List[Tuple[int, np.ndarray, Optional[np.ndarray]]]: 
            A list where each element is a tuple containing:
            - Device ID
            - Input subset for the device
            - Output subset for the device (or None if outputs are not provided)
    """
    num_devices = len(devices)
    if num_devices == 0:
        raise ValueError("No devices available for training.")

    validate_dataset(inputs, outputs)

    total_samples = len(inputs)
    samples_per_device = total_samples // num_devices
    remainder = total_samples % num_devices

    datasets = []
    start_idx = 0

    for i, device in enumerate(devices):

        current_samples = samples_per_device + (1 if i < remainder else 0)
        end_idx = start_idx + current_samples
        device_inputs = np.asarray(inputs[start_idx:end_idx])
        device_outputs = np.asarray(outputs[start_idx:end_idx]) if include_outputs else None

        datasets.append(
            (
                device,
                device_inputs,
                device_outputs,
            )
        )
        start_idx = end_idx

    assert start_idx == total_samples, "Not all samples were assigned to devices."

    return datasets
