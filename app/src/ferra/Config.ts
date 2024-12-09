// Config.ts

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

export interface ReceiveConfig {
  modelJson: JSON;  
  weights: number[][][];
  batchSize: number;
  inputs: number[][][];
  inputShape: number[][][];
  outputs?: number[][][];
  outputShape?: number[][][];
  epochs?: number;
  datasetsPerDevice?: number; 
}

export interface SendConfig {
  weights: number[][][];
  outputs?: number[][][];
  loss: number;
}

export async function processSendConfig(
  model: tf.LayersModel,
  loss: number,
  modelOutputs?: tf.Tensor[]
): Promise<{
  weights: number[][][];  // Changed to support up to 3D arrays
  outputs?: number[][];
  loss: number;
}> {
  try {
    const weights = model.getWeights();
    const weightData: number[][][] = [];  // Changed to 3D array
    const outputData: number[][] = [];

    // Process weights
    for (const tensor of weights) {
      try {
        const data = await tensor.array();  // Use array() instead of data()
        weightData.push(data);
      } catch (tensorError) {
        console.error('Error processing weight tensor:', tensorError);
        throw tensorError;
      } finally {
        tensor.dispose();
      }
    }
    
    // Initialize sendConfig with weights
    const sendConfig: {
      weights: number[][][];  // Changed to 3D array
      outputs?: number[][];
      loss: number;
    } = {
      weights: weightData,
      loss: loss
    };

    // Process outputs only if modelOutputs is provided
    if (modelOutputs && modelOutputs.length > 0) {
      for (const tensor of modelOutputs) {
        try {
          const data = await tensor.array();  // Use array() instead of data()
          outputData.push(data);
        } catch (tensorError) {
          console.error('Error processing output tensor:', tensorError);
          throw tensorError;
        } finally {
          tensor.dispose();
        }
      }

      // Add outputs to sendConfig
      sendConfig.outputs = outputData;
    }

    return sendConfig;
  } catch (error) {
    console.error('Error in processSendConfig:', error);
    throw new Error(`Failed to process send config: ${error}`);
  }
}