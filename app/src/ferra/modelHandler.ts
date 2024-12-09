// ModelHandler.ts

import * as tf from '@tensorflow/tfjs';
import { createLossFunction } from './Losses';
import { createOptimizer } from './Optimizers';
import { ReceiveConfig } from './Config';

export const loadModel = async (receiveConfig: ReceiveConfig): Promise<tf.LayersModel> => {
  try { 
    console.log('RecieveConfig', receiveConfig);

    const customIOHandler = {
      load: async () => {
        return {
          modelTopology: receiveConfig.modelJson.modelTopology,
          format: receiveConfig.modelJson.format || 'layers-model',
          generatedBy: receiveConfig.modelJson.generatedBy,
          convertedBy: receiveConfig.modelJson.convertedBy,
          // Intentionally omit weightsManifest to prevent automatic weight loading
        };
      }
    };
  
    // Load the model architecture using the custom IOHandler
    const loadedModel = await tf.loadLayersModel(customIOHandler);

    // Load the weights from the received config
    const weightTensors = receiveConfig.weights.map(data => tf.tensor(data));
    loadedModel.setWeights(weightTensors);
    weightTensors.forEach(tensor => tensor.dispose());

    const optimizer = createOptimizer(receiveConfig.modelJson);
    const lossFunction = createLossFunction(receiveConfig.modelJson);

    if (optimizer && lossFunction) {
      loadedModel.compile({
        optimizer: optimizer,
        loss: lossFunction,
      });
      console.log('Model compiled with extracted optimizer and loss function.');
    } else {
      console.warn('Optimizer or loss function information not found in model');
    }

    console.log('Model loaded from signed URL and compiled.');
    return loadedModel;

  } catch (error) {
    console.error('Error loading the model:', error);
    throw error;
  }
};