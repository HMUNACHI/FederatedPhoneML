// Evaluator.ts

import * as tf from '@tensorflow/tfjs';
import { loadModel } from './ModelHandler';
import { ReceiveConfig, processSendConfig, SendConfig } from './Config';
import { initializeTf } from './TensorflowHandler';

export const runEvaluation = async (
  receiveConfig: ReceiveConfig,
): Promise<SendConfig> => {

  await initializeTf();
  const model = await loadModel(receiveConfig);
  const inputTensor = tf.tensor2d(receiveConfig.inputs, receiveConfig.inputShape);
  const outputTensor = tf.tensor2d(receiveConfig.outputs, receiveConfig.outputShape);

  try {
    if (!model.loss) {
      throw new Error('Please ensure the model is loaded and compiled correctly.');
    }

    const batchSize = receiveConfig.batchSize;
    const numSamples = inputTensor.shape[0];
    const numBatches = Math.ceil(numSamples / batchSize);
    let totalLoss = 0;

    // Evaluate in batches to manage memory
    for (let batch = 0; batch < numBatches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, numSamples);
      
      const batchInputs = inputTensor.slice([start, 0], [end - start, -1]);
      const batchOutputs = outputTensor.slice([start, 0], [end - start, -1]);

      // Calculate loss for this batch
      const lossValue = tf.tidy(() => {
        const preds = model.predict(batchInputs) as tf.Tensor;
        const lossVal = model.loss(batchOutputs, preds);
        return lossVal;
      });

      totalLoss += lossValue.dataSync()[0] * (end - start);
      lossValue.dispose();
      
      batchInputs.dispose();
      batchOutputs.dispose();

    }

    // Calculate average loss
    const averageLoss = totalLoss / numSamples;
    console.log(`Evaluation Loss: ${averageLoss.toFixed(4)}`);
    const sendConfig = await processSendConfig(model, averageLoss);

    return sendConfig;
  } catch (error) {
    console.error('Error during evaluation:', error);
    throw error;
  }
};