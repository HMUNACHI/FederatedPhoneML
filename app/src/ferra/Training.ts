// Training.ts

import * as tf from '@tensorflow/tfjs';
import { loadModel } from './ModelHandler';
import { ReceiveConfig, processSendConfig, SendConfig } from './Config';
import { initializeTf } from './TensorflowHandler';

export const runTraining = async (
  receiveConfig: ReceiveConfig,
): Promise<SendConfig> => {
  try {
    // Initialize TensorFlow.js environment
    await initializeTf();

    // Load the model based on the receiveConfig
    const model = await loadModel(receiveConfig);

    // Prepare input and output tensors
    const inputTensor = tf.tensor2d(receiveConfig.inputs, receiveConfig.inputShape);
    const outputTensor = tf.tensor2d(receiveConfig.outputs, receiveConfig.outputShape);

    // Ensure the model is compiled with an optimizer and loss function
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

    // Initialize accumulated gradients as separate tensors
    const accumulatedGradients: tf.NamedTensorMap = {};
    model.trainableWeights.forEach(weight => {
      // Clone the tensors to ensure they are separate from model variables
      accumulatedGradients[weight.name] = tf.zerosLike(weight.read()).clone();
    });

    // Training loop
    for (let epoch = 1; epoch <= epochs; epoch++) {
      let epochLoss = 0;
      let step = 0;

      for (let batch = 0; batch < numBatches; batch++) {
        const start = batch * microBatchSize;
        const end = Math.min(start + microBatchSize, numSamples);

        // Slice the input and output tensors for the current batch
        const batchInputs = inputTensor.slice([start, 0], [end - start, -1]);
        const batchOutputs = outputTensor.slice([start, 0], [end - start, -1]);

        // Compute gradients and loss inside tf.tidy to manage temporary tensors
        const { lossValue, grads } = tf.tidy(() => {
          const lossFunction = () => {
            const preds = model.predict(batchInputs) as tf.Tensor;
            const loss = (model.loss as any)(batchOutputs, preds);
            preds.dispose(); // Dispose predictions to free memory
            return loss;
          };
          // Compute gradients with respect to model variables
          const { value, grads } = tf.variableGrads(lossFunction);
          return { lossValue: value, grads };
        });

        // Accumulate loss
        const batchLoss = lossValue.dataSync()[0] * (end - start);
        epochLoss += batchLoss;
        lossValue.dispose(); // Dispose loss tensor

        // Accumulate gradients
        model.trainableWeights.forEach(weight => {
          const weightName = weight.name;
          if (grads[weightName]) {
            // Accumulate gradients by adding them to the existing accumulated gradients
            accumulatedGradients[weightName] = tf.add(accumulatedGradients[weightName], grads[weightName]);

            // Dispose the current batch gradient tensor to free memory
            grads[weightName].dispose();
          }
        });

        step++;

        // Apply gradients when accumulation steps are met
        if (step % accumulationSteps === 0) {
          // Compute averaged gradients
          const averagedGradients: tf.NamedTensorMap = {};
          model.trainableWeights.forEach(weight => {
            const weightName = weight.name;
            averagedGradients[weightName] = tf.div(accumulatedGradients[weightName], accumulationSteps);
          });

          // Apply the averaged gradients to update model weights
          (model.optimizer as tf.Optimizer).applyGradients(averagedGradients);

          // Dispose the averaged gradients tensors
          model.trainableWeights.forEach(weight => {
            const weightName = weight.name;
            averagedGradients[weightName].dispose();
          });

          // Reset accumulated gradients for the next accumulation cycle
          model.trainableWeights.forEach(weight => {
            const weightName = weight.name;
            accumulatedGradients[weightName].dispose(); // Dispose previous accumulation
            accumulatedGradients[weightName] = tf.zerosLike(weight.read()).clone();
          });
        }

        // Dispose batch tensors to free memory
        batchInputs.dispose();
        batchOutputs.dispose();
      }

      // Apply remaining gradients if any (when total batches are not perfectly divisible)
      if (step % accumulationSteps !== 0) {
        const remainingSteps = step % accumulationSteps;

        // Compute averaged gradients for the remaining steps
        const averagedGradients: tf.NamedTensorMap = {};
        model.trainableWeights.forEach(weight => {
          const weightName = weight.name;
          averagedGradients[weightName] = tf.div(accumulatedGradients[weightName], remainingSteps);
        });

        // Apply the averaged gradients
        (model.optimizer as tf.Optimizer).applyGradients(averagedGradients);

        // Dispose the averaged gradients tensors
        model.trainableWeights.forEach(weight => {
          const weightName = weight.name;
          averagedGradients[weightName].dispose();
        });

        // Reset accumulated gradients
        model.trainableWeights.forEach(weight => {
          const weightName = weight.name;
          accumulatedGradients[weightName].dispose(); // Dispose previous accumulation
          accumulatedGradients[weightName] = tf.zerosLike(weight.read()).clone();
        });
      }

      // Calculate average loss for the epoch
      const averageLoss = epochLoss / numSamples;
      console.log(`Epoch ${epoch}: Loss = ${averageLoss.toFixed(4)}`);
      finalLoss = averageLoss; // Update final loss
    }

    // After training, process SendConfig without model outputs
    const sendConfig: SendConfig = await processSendConfig(model, finalLoss);

    console.log('Success', 'Model trained and SendConfig created successfully.');
    return sendConfig;

  } catch (error) {
    console.error('Error during training:', error);
    throw error; // Re-throw the error after logging
  }
};
