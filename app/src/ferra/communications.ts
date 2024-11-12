// communications.ts

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

export interface Config {
  'model.json': string;
  'datasets.json': string;
  'validation_datasets': string;
  'epochs': number;
  'datasets_per_device': number;
  'batch_size': number;
}

export interface WeightsUpdate {
  weights: any[];
  loss: number;
}

export async function getConfig(serverUrl: string): Promise<Config | null> {
  try {
    const response = await fetch(serverUrl);

    if (response.ok) {
      const config: Config = await response.json();
      console.log('Fetched the initial config for a job');
      return config;
    } else {
      console.error('Failed to fetch initial config for a job:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error in getJob:', error);
    return null;
  }
}


export async function sendWeights(model: any, loss: number, serverUrl: string) {
  try {
    const weights = model.getWeights();
    const weightData = [];

    for (const tensor of weights) {
      const values = await tensor.array();
      weightData.push(values);
    }

    const update: WeightsUpdate = {
      weights: weightData,
      loss: loss
    };

    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('Server response:', responseData);
    } else {
      console.error('Failed to send weights and loss:', response.statusText);
    }
  } catch (error) {
    console.error('Error in sendWeights:', error);
  }
}


export async function getWeights(model: any, serverUrl: string) {
  try {
    const response = await fetch(serverUrl);

    if (response.ok) {
      const weightData = await response.json();
      const weightTensors = weightData.map(data => tf.tensor(data));
      model.setWeights(weightTensors);
      weightTensors.forEach(tensor => tensor.dispose());
      
      console.log('Weights fetched and set successfully');
    } else {
      console.error('Failed to fetch weights:', response.statusText);
    }
  } catch (error) {
    console.error('Error in getWeights:', error);
  }
}