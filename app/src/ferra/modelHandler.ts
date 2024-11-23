// ModelHandler.ts

import * as tf from '@tensorflow/tfjs';
import { fetch } from '@tensorflow/tfjs-react-native';
import { createLossFunction } from './Losses';
import { createOptimizer } from './optimizers';
import { ReceiveConfig } from './Config';

export const loadModel = async (receiveConfig: ReceiveConfig): Promise<tf.LayersModel> => {
  try { 
    const modelJsonUrl = receiveConfig.modelUrl;
    const weightsMap = receiveConfig.weights;

    const weightUrlConverter = (weightFileName: string): string => {
      const weightUrl = weightsMap[weightFileName];
      if (weightUrl) {
        return weightUrl;
      }
      throw new Error(`"${weightFileName}" not found in receiveConfig.weights.`);
    };

    const loadedModel = await tf.loadLayersModel(modelJsonUrl, {
      fetchFunc: fetch,
      weightUrlConverter: weightUrlConverter,
    });

    const response = await fetch(modelJsonUrl);
    const modelJson = await response.json();

    const optimizer = createOptimizer(modelJson);
    const lossFunction = createLossFunction(modelJson);

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