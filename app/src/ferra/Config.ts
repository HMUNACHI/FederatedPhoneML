// Config.ts

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

export interface ReceiveConfig {
  modelJson: JSON;  
  weights: { [shardFileName: string]: string };
  batchSize: number;
  inputs: number[][];
  inputShape: number[];
  outputs?: number[][];
  outputShape?: number[];
  epochs?: number;
  datasetsPerDevice?: number;  
}

export interface SendConfig {
  weights: Float32Array[];
  outputs?: Float32Array[];
  loss: number;
}

export async function processSendConfig(
  model: tf.LayersModel,
  loss: number,
  modelOutputs?: tf.Tensor[] // Make modelOutputs optional
): Promise<SendConfig> {
  try {
    const weights = model.getWeights();
    const weightData: Float32Array[] = [];
    const outputData: Float32Array[] = [];

    // Process weights
    for (const tensor of weights) {
      try {
        const data = new Float32Array(await tensor.data());
        weightData.push(data);
      } catch (tensorError) {
        console.error('Error processing weight tensor:', tensorError);
        throw tensorError;
      } finally {
        tensor.dispose();  // Ensure tensor is disposed even if an error occurs
      }
    }
    
    // Initialize SendConfig with weights
    const sendConfig: SendConfig = {
      weights: weightData,
      loss: loss
    };

    // Process outputs only if modelOutputs is provided
    if (modelOutputs && modelOutputs.length > 0) {
      for (const tensor of modelOutputs) {
        try {
          const data = new Float32Array(await tensor.data());
          outputData.push(data);
        } catch (tensorError) {
          console.error('Error processing output tensor:', tensorError);
          throw tensorError;
        } finally {
          tensor.dispose();  // Ensure tensor is disposed even if an error occurs
        }
      }

      // Add outputs to SendConfig
      sendConfig.outputs = outputData;
    }

    return sendConfig;
  } catch (error) {
    console.error('Error in processSendConfig:', error);
    throw new Error(`Failed to process send config: ${error}`);
  }
}