// evaluator.ts

import * as tf from '@tensorflow/tfjs';
import { Alert } from 'react-native';
import { Config } from './communications';

export const evaluate = async (
  model: tf.LayersModel,
  inputs: tf.Tensor,
  outputs: tf.Tensor,
  config: Config
): Promise<number> => {
  try {
    if (!model.loss) {
      throw new Error('Model is not compiled. Please ensure the model is loaded and compiled correctly.');
    }

    const batchSize = config['batch_size'];
    const numSamples = inputs.shape[0];
    const numBatches = Math.ceil(numSamples / batchSize);
    let totalLoss = 0;

    // Evaluate in batches to manage memory
    for (let batch = 0; batch < numBatches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, numSamples);
      
      const batchInputs = inputs.slice([start, 0], [end - start, -1]);
      const batchOutputs = outputs.slice([start, 0], [end - start, -1]);

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

      await tf.nextFrame(); // Allow UI updates
    }

    // Calculate average loss
    const averageLoss = totalLoss / numSamples;
    console.log(`Evaluation Loss: ${averageLoss.toFixed(4)}`);

    return averageLoss;
  } catch (error) {
    console.error('Error during evaluation:', error);
    Alert.alert('Error', 'Failed to evaluate the model.');
    throw error;
  }
};