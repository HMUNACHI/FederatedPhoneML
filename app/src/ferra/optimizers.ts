// Optimizers.ts

import * as tf from '@tensorflow/tfjs';

export function createOptimizer(modelJson) {
  const optimizerConfig = modelJson.modelTopology?.training_config?.optimizer_config;
  
  if (!optimizerConfig) {
    throw new Error("Optimizer configuration not found in the model JSON.");
  }
  
  const className = optimizerConfig.class_name;
  const config = optimizerConfig.config;
  let optimizer;

  switch (className.toLowerCase()) {
    case 'sgd':
      const sgdLearningRate = config.learning_rate !== undefined ? config.learning_rate : 0.01;
      const sgdMomentum = config.momentum !== undefined ? config.momentum : 0.0;
      optimizer = tf.train.sgd(sgdLearningRate, sgdMomentum);
      break;

    case 'adam':
      const adamLearningRate = config.learning_rate !== undefined ? config.learning_rate : 0.001;
      const adamBeta1 = config.beta_1 !== undefined ? config.beta_1 : 0.9;
      const adamBeta2 = config.beta_2 !== undefined ? config.beta_2 : 0.999;
      const adamEpsilon = config.epsilon !== undefined ? config.epsilon : 1e-7;
      optimizer = tf.train.adam(adamLearningRate, adamBeta1, adamBeta2, adamEpsilon);
      break;

    case 'rmsprop':
      const rmsLearningRate = config.learning_rate !== undefined ? config.learning_rate : 0.001;
      const rmsRho = config.rho !== undefined ? config.rho : 0.9;
      const rmsMomentum = config.momentum !== undefined ? config.momentum : 0.0;
      const rmsEpsilon = config.epsilon !== undefined ? config.epsilon : 1e-7;
      const rmsCentered = config.centered !== undefined ? config.centered : false;
      
      optimizer = tf.train.rmsprop(rmsLearningRate, rmsRho, rmsMomentum, rmsEpsilon, rmsCentered);
      break;

    default:
      throw new Error(`Unsupported optimizer class name: ${className}`);
  }

  return optimizer;
}