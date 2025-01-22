// Losses.ts

import * as tf from '@tensorflow/tfjs';

export function createLossFunction(modelJson) {
  const loss = modelJson.modelTopology?.training_config?.loss;
  
  if (!loss) {
    throw new Error("Loss function not found in the model JSON.");
  }

  console.log(`Loss function: ${loss}`);
  
  const lossMapping = {
    'mean_squared_error': tf.losses.meanSquaredError,
    'mse': tf.losses.meanSquaredError,
    'mean_absolute_error': tf.losses.absoluteDifference,
    'mae': tf.losses.absoluteDifference,
    'categorical_crossentropy': tf.losses.softmaxCrossEntropy,
    'binary_crossentropy': tf.losses.sigmoidCrossEntropy,
    'sparse_categorical_crossentropy': tf.losses.softmaxCrossEntropy,
    'hinge': tf.losses.hingeLoss,
    'huber_loss': tf.losses.huberLoss,
    'kl_divergence': tf.losses.kullbackLeiblerDivergence,
    'cosine_similarity': tf.losses.cosineDistance,
  };

  const tfjsLoss = lossMapping[loss.toLowerCase()];
  
  if (!tfjsLoss) {
    throw new Error(`Unsupported loss function: ${loss}`);
  }

  switch (loss.toLowerCase()) {
    case 'categorical_crossentropy':
    case 'binary_crossentropy':
      return (yTrue, yPred) => tfjsLoss(yTrue, yPred, {from_logits: false});
    case 'sparse_categorical_crossentropy':
      return (yTrue, yPred) => tfjsLoss(yTrue, yPred, {from_logits: false, axis: -1});
    case 'huber_loss':
      return (yTrue, yPred) => tfjsLoss(yTrue, yPred, 1.0); 
    case 'cosine_similarity':
      return (yTrue, yPred) => tfjsLoss(yTrue, yPred, -1); 
    default:
      return tfjsLoss;
  }
}
