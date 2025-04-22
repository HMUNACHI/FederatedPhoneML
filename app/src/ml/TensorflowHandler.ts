// tensorflowInitializer.ts

import * as tf from '@tensorflow/tfjs';

export const initializeTf = async (): Promise<void> => {
  try {
    await tf.ready();
    console.log('TensorFlow.js is ready.');
  } catch (error) {
    console.error('Error initializing TensorFlow.js:', error);
    throw error;
  }
};