// modelHandler.ts

import * as tf from '@tensorflow/tfjs';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from '@tensorflow/tfjs-react-native';
import { createLossFunction } from './losses';
import { createOptimizer } from './optimizers';
import { Config } from './communications';

const MODEL_STORAGE_KEY = '@my_model';

export const loadModel = async (config: Config): Promise<tf.LayersModel> => {
  try {
    const modelJsonUrl = config['model.json'];
    const weightsUrl = config['group1-shard1of1.bin'];

    const weightUrlConverter = (weightFileName: string) => {
      if (weightFileName === 'group1-shard1of1.bin') {
        return weightsUrl;
      }
      return weightFileName;
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
      console.warn('Optimizer or loss function information not found in model.json');
    }

    console.log('Model loaded from signed URL and compiled.');
    Alert.alert('Success', 'Model loaded and compiled successfully.');
    return loadedModel;

  } catch (error) {
    console.error('Error loading the model:', error);
    throw error;
  }
};


export const saveModel = async (model: tf.LayersModel): Promise<void> => {
  try {
    const saveResult = await model.save(
      tf.io.withSaveHandler(async (artifacts) => {
        const modelString = JSON.stringify(artifacts);
        await AsyncStorage.setItem(MODEL_STORAGE_KEY, modelString);
        console.log('Model saved to AsyncStorage.');
        return {
          modelArtifactsInfo: {
            dateSaved: new Date().toISOString(),
            modelTopologyType: 'LayersModel',
            weightDataBytes: artifacts.weightData.byteLength,
            weightSpecsLength: artifacts.weightSpecs.length,
          },
        };
      })
    );

    console.log('Model artifacts saved:', saveResult);
  } catch (error) {
    console.error('Error saving the model:', error);
    Alert.alert('Error', 'Failed to save the model.');
    throw error;
  }
};