// Training.ts

import * as tf from '@tensorflow/tfjs';
import { loadModel } from './ModelHandler';
import { ReceiveConfig, processSendConfig, SendConfig } from './Config';
import { initializeTf } from './TensorflowHandler';

export const runTraining = async (
  receiveConfig: ReceiveConfig,
): Promise<SendConfig> => {
  try {
    
    await initializeTf();
    const model = await loadModel(receiveConfig);

    // Prepare input and output tensors (assumed to be 2D arrays for now)
    const inputTensor = tf.tensor2d(receiveConfig.inputs, receiveConfig.inputShape);
    const outputTensor = tf.tensor2d(receiveConfig.outputs, receiveConfig.outputShape);

    // Ensure the model is compiled with optimizer and loss function
    if (!model.optimizer || !model.loss) {
      throw new Error('Model is not compiled. Please ensure the model is loaded and compiled correctly.');
    }

    // Extract training configurations
    const epochs = receiveConfig.epochs;
    const effectiveBatchSize = receiveConfig.datasetsPerDevice;
    const microBatchSize = receiveConfig.batchSize;

    // Validate batch sizes
    if (effectiveBatchSize % microBatchSize !== 0) {
      throw new Error('Effective batch size must be divisible by micro batch size.');
    }

    const accumulationSteps = effectiveBatchSize / microBatchSize;
    const numSamples = inputTensor.shape[0];
    const numBatches = Math.ceil(numSamples / microBatchSize);

    let finalLoss = 0; // Initialize final loss

    // Training loop
    for (let epoch = 1; epoch <= epochs; epoch++) {
      let epochLoss = 0;
      let accumulatedGradients: tf.NamedTensorMap | null = null;
      let step = 0;

      for (let batch = 0; batch < numBatches; batch++) {
        const start = batch * microBatchSize;
        const end = Math.min(start + microBatchSize, numSamples);

        // Slice the input and output tensors for the current batch
        const batchInputs = inputTensor.slice([start, 0], [end - start, -1]);
        const batchOutputs = outputTensor.slice([start, 0], [end - start, -1]);

        // Compute gradients and loss
        const { value: lossValue, grads } = tf.variableGrads(() => {
          const preds = model.predict(batchInputs) as tf.Tensor;
          const lossVal = model.loss(batchOutputs, preds);
          preds.dispose();
          return lossVal;
        });

        // Accumulate loss
        epochLoss += lossValue.dataSync()[0] * (end - start);
        lossValue.dispose();

        // Initialize accumulated gradients if null
        if (accumulatedGradients === null) {
          accumulatedGradients = {};
          Object.keys(grads).forEach(key => {
            accumulatedGradients![key] = tf.zerosLike(grads[key]);
          });
        }

        // Accumulate gradients
        Object.keys(grads).forEach(key => {
          accumulatedGradients![key] = tf.add(accumulatedGradients![key], grads[key]);
          grads[key].dispose();
        });

        step++;

        // Apply gradients when accumulation steps are met
        if (step % accumulationSteps === 0) {
          const averagedGradients: tf.NamedTensorMap = {};
          Object.keys(accumulatedGradients).forEach(key => {
            averagedGradients[key] = tf.div(accumulatedGradients![key], accumulationSteps);
          });

          (model.optimizer as tf.Optimizer).applyGradients(averagedGradients);

          // Dispose averaged gradients and reset accumulated gradients
          Object.keys(averagedGradients).forEach(key => {
            averagedGradients[key].dispose();
            accumulatedGradients![key].dispose();
            accumulatedGradients![key] = tf.zerosLike(averagedGradients[key]);
          });
        }

        // Dispose batch tensors
        batchInputs.dispose();
        batchOutputs.dispose();
      }

      // Apply remaining gradients if any
      if (step % accumulationSteps !== 0 && accumulatedGradients !== null) {
        const remainingSteps = step % accumulationSteps;
        const averagedGradients: tf.NamedTensorMap = {};
        Object.keys(accumulatedGradients).forEach(key => {
          averagedGradients[key] = tf.div(accumulatedGradients![key], remainingSteps);
        });

        (model.optimizer as tf.Optimizer).applyGradients(averagedGradients);

        Object.keys(averagedGradients).forEach(key => {
          averagedGradients[key].dispose();
          accumulatedGradients![key].dispose();
        });
      }

      // Calculate average loss for the epoch
      const averageLoss = epochLoss / numSamples;
      console.log(`Epoch ${epoch}: Loss = ${averageLoss.toFixed(4)}`);
      finalLoss = averageLoss; // Update final loss
    }

    // After training, process SendConfig without model outputs
    const sendConfig: SendConfig = await processSendConfig(model, finalLoss);

    // Dispose tensors and model
    inputTensor.dispose();
    outputTensor.dispose();
    model.dispose();

    console.log('Success', 'Model trained and SendConfig created successfully.');
    return sendConfig;

  } catch (error) {
    console.error('Error during training:', error);
    throw error; // Re-throw the error after logging
  }
};
