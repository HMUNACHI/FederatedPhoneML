// predictor.ts

import * as tf from '@tensorflow/tfjs';
import { Alert } from 'react-native';

export const makePrediction = (
  model: tf.LayersModel,
  input: string,
  setPredictionResult: React.Dispatch<React.SetStateAction<string>>
): void => {
  try {
    const inputNumber = parseFloat(input);
    if (isNaN(inputNumber)) {
      Alert.alert('Invalid Input', 'Please enter a valid number.');
      return;
    }

    const inputTensor = tf.tensor2d([inputNumber], [1, 1]);
    const outputTensor = model.predict(inputTensor) as tf.Tensor;
    const outputData = outputTensor.dataSync()[0].toFixed(2);
    setPredictionResult(outputData);
    tf.dispose([inputTensor, outputTensor]);
  } catch (error) {
    console.error('Error making prediction:', error);
    Alert.alert('Error', 'Failed to make a prediction.');
  }
};