// losses.ts

import * as tf from '@tensorflow/tfjs';

export function createLossFunction(modelJson) {
  const loss = modelJson.modelTopology?.training_config?.loss;
  
  if (!loss) {
    throw new Error("Loss function not found in the model JSON.");
  }
  
  const lossMapping = {
    'mean_squared_error': tf.losses.meanSquaredError,
    'mean_absolute_error': tf.losses.meanAbsoluteError,
    'categorical_crossentropy': tf.losses.categoricalCrossentropy,
    'binary_crossentropy': tf.losses.binaryCrossentropy,
    'sparse_categorical_crossentropy': tf.losses.sparseCategoricalCrossentropy,
    'hinge': tf.losses.hinge,
    'huber_loss': tf.losses.huberLoss,
    'kl_divergence': tf.losses.kullbackLeiblerDivergence,
    'log_cosh': tf.losses.logCosh,
    'poisson': tf.losses.poisson,
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