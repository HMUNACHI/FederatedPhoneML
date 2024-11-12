// modelReset.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const MODEL_STORAGE_KEY = '@my_model';

export const resetModel = async (
  setModel: React.Dispatch<React.SetStateAction<tf.LayersModel | null>>,
  setIsModelLoaded: React.Dispatch<React.SetStateAction<boolean>>,
  setIsModelTrained: React.Dispatch<React.SetStateAction<boolean>>,
  setPredictionInput: React.Dispatch<React.SetStateAction<string>>,
  setPredictionResult: React.Dispatch<React.SetStateAction<string>>,
  setTrainingStatus: React.Dispatch<React.SetStateAction<string>>
): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MODEL_STORAGE_KEY);
    setModel(null);
    setIsModelLoaded(false);
    setIsModelTrained(false);
    setPredictionInput('');
    setPredictionResult('');
    setTrainingStatus('');
    console.log('Model reset.');
    Alert.alert('Reset', 'Model has been reset.');
  } catch (error) {
    console.error('Error resetting the model:', error);
    Alert.alert('Error', 'Failed to reset the model.');
    throw error;
  }
};