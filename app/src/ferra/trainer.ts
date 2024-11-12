// trainer.ts

import * as tf from '@tensorflow/tfjs';
import { Alert } from 'react-native';
import { loadDatasets } from './dataLoader';
import { saveModel } from './modelHandler';
import { Config } from './communications';

export const episode = async (
  model: tf.LayersModel,
  config: Config, 
  setTrainingStatus: React.Dispatch<React.SetStateAction<string>>
): Promise<void> => {
  try {
    setTrainingStatus('Loading training data...');
    const { inputs, outputs } = await loadDatasets(config);

    setTrainingStatus('Preparing for training...');
    if (!model.optimizer || !model.loss) {
      throw new Error('Model is not compiled. Please ensure the model is loaded and compiled correctly.');
    }

    setTrainingStatus('Training model...');
    const epochs = config['local_epochs'];
    const effectiveBatchSize = config['datasets_per_device'];
    const microBatchSize = config['batch_size'] 

    if (effectiveBatchSize % microBatchSize !== 0) {
      throw new Error('Effective batch size must be divisible by micro batch size.');
    }

    const accumulationSteps = effectiveBatchSize / microBatchSize;
    const numSamples = inputs.shape[0];
    const numBatches = Math.ceil(numSamples / microBatchSize);

    for (let epoch = 1; epoch <= epochs; epoch++) { 
      let epochLoss = 0;
      let accumulatedGradients: tf.NamedTensorMap | null = null;
      let step = 0;

      for (let batch = 0; batch < numBatches; batch++) {
        const start = batch * microBatchSize;
        const end = Math.min(start + microBatchSize, numSamples);

        const batchInputs = inputs.slice([start, 0], [end - start, -1]);
        const batchOutputs = outputs.slice([start, 0], [end - start, -1]);

        const { value: lossValue, grads } = tf.variableGrads(() => {
          const preds = model.predict(batchInputs) as tf.Tensor;
          const lossVal = model.loss(batchOutputs, preds);
          preds.dispose(); 
          return lossVal;
        });

        epochLoss += lossValue.dataSync()[0] * (end - start); 
        lossValue.dispose();

        if (accumulatedGradients === null) {
          accumulatedGradients = {};
          Object.keys(grads).forEach(key => {
            accumulatedGradients![key] = tf.zerosLike(grads[key]);
          });
        }

        Object.keys(grads).forEach(key => {
          accumulatedGradients![key] = tf.add(accumulatedGradients![key], grads[key]);
          grads[key].dispose();
        });

        step++;

        if (step % accumulationSteps === 0) {
          const averagedGradients: tf.NamedTensorMap = {};
          Object.keys(accumulatedGradients).forEach(key => {
            averagedGradients[key] = tf.div(accumulatedGradients![key], accumulationSteps);
          });

          (model.optimizer as tf.Optimizer).applyGradients(averagedGradients);

          Object.keys(averagedGradients).forEach(key => {
            averagedGradients[key].dispose();
            accumulatedGradients![key].dispose();
            accumulatedGradients![key] = tf.zerosLike(averagedGradients[key]); 
          });
        }

        batchInputs.dispose();
        batchOutputs.dispose();

        await tf.nextFrame(); // Yield to allow UI updates
      }

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

      const averageLoss = epochLoss / numSamples;
      console.log(`Epoch ${epoch}: Loss = ${averageLoss.toFixed(4)}`);

      setTrainingStatus(`Training... Epoch ${epoch}/${epochs} | Loss: ${averageLoss.toFixed(4)}`);

      await tf.nextFrame(); 
    }

    await saveModel(model);
    inputs.dispose();
    outputs.dispose();

    Alert.alert('Success', 'Model trained and saved successfully.');
  } catch (error) {
    console.error('Error during training:', error);
    Alert.alert('Error', 'Failed to train the model.');
  }
};
