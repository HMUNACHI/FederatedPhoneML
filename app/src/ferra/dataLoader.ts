// dataLoader.ts

import * as tf from '@tensorflow/tfjs';
import { Alert } from 'react-native';
import { fetch } from '@tensorflow/tfjs-react-native';
import { Config } from './communications';


export const loadDatasets = async (
  config: Config
): Promise<{ inputs: tf.Tensor; outputs: tf.Tensor }> => {
  try {
    const datasetsUrl = config['datasets.json'];

    if (!datasetsUrl) {
      throw new Error('datasets.json URL not found in communications.ts');
    }

    const response = await fetch(datasetsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch datasets.json: ${response.status} ${response.statusText}`);
    }

    const datasets = await response.json();

    if (!datasets.inputs || !datasets.outputs) {
      throw new Error('datasets.json must contain "inputs" and "outputs" properties.');
    }

    const convertToTensor = (data: any, shape?: number[]): tf.Tensor => {
      try {
        if (shape && Array.isArray(shape)) {
          return tf.tensor(data, shape);
        }
        return tf.tensor(data);
      } catch (err) {
        throw new Error(`Failed to convert data to tensor: ${err}`);
      }
    };

    const inputs = convertToTensor(datasets.inputs, datasets.input_shape);
    const outputs = convertToTensor(datasets.outputs, datasets.output_shape);
    console.log(datasets.inputs);
    console.log(datasets.outputs);
    console.log('Datasets loaded successfully.');
    Alert.alert('Success', 'Datasets loaded successfully.');

    return { inputs, outputs };
  } catch (error) {
    console.error('Error loading datasets:', error);
    Alert.alert('Error', 'Failed to load datasets.');
    throw error;
  }
};