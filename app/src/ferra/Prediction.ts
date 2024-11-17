// Prediction.ts

import * as tf from '@tensorflow/tfjs';
import { loadModel } from './ModelHandler';
import { ReceiveConfig, processSendConfig, SendConfig } from './Config';
import { initializeTf } from './TensorflowHandler';

export const runPrediction = async (
  receiveConfig: ReceiveConfig,
): Promise<SendConfig> => { 

  await initializeTf();
  const model = await loadModel(receiveConfig);

  const inputTensor = tf.tensor2d(receiveConfig.inputs, receiveConfig.inputShape);
  const allPredictions: tf.Tensor[] = []; 

  try {
    if (typeof model.predict !== 'function') {
      throw new Error('The loaded model does not have a predict method.');
    }

    const batchSize = receiveConfig.batchSize;
    const numSamples = inputTensor.shape[0];
    const numBatches = Math.ceil(numSamples / batchSize);

    // Predict in batches to manage memory
    for (let batch = 0; batch < numBatches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, numSamples);
      
      const batchInputs = inputTensor.slice([start, 0], [end - start, -1]);

      // Make prediction on the current batch
      const batchPreds = model.predict(batchInputs) as tf.Tensor;
      allPredictions.push(batchPreds); // Keep the tensor for later processing
      batchInputs.dispose();
      // Do NOT dispose of batchPreds here; it will be handled in processSendConfig
    }


    // Create SendConfig with model weights and predictions
    const sendConfig: SendConfig = await processSendConfig(model, 0, allPredictions);

    // Dispose of the input tensor and the model after processing
    inputTensor.dispose();
    model.dispose();

    console.log('Success', 'Model predictions processed and SendConfig created successfully.');
    return sendConfig;
  } catch (error) {
    console.error('Error during prediction:', error); 

    inputTensor.dispose();
    model.dispose();

    throw error; // Re-throw the error after logging
  }
};
