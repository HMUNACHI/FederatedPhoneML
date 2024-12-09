from typing import List, Tuple

import numpy as np

def average_model_weights(all_weights: List[List[np.ndarray]]) -> List[np.ndarray]:
    """Compute average of model weights"""
    averaged_weights = []
    for layer_weights in zip(*all_weights):
        avg_layer_weights = np.mean(layer_weights, axis=0)
        averaged_weights.append(avg_layer_weights)
    return averaged_weights


def average_epoch_loss(losses: List[Tuple[float, int]]) -> float:
    """Compute weighted average of losses"""
    total_samples = sum(samples for _, samples in losses)
    average_loss = sum(loss * samples for loss, samples in losses) / total_samples
    return average_loss
