// App.tsx
import React, { useEffect, useState } from 'react';
import { Text, View, Button, ActivityIndicator, TextInput, Alert } from 'react-native';
import { styles } from '../styles/styles';
import { mlEngine } from '../ferra/engine';

const App = () => {
  const [isTfReady, setIsTfReady] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [predictionInput, setPredictionInput] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<string>('');

  useEffect(() => {
    const initialize = async () => {
      try {
        const state = await mlEngine.initialize();
        setIsTfReady(state.isTfReady);
        setIsModelLoaded(state.isModelLoaded);
        setIsModelTrained(state.isModelTrained);
      } catch (error) {
        Alert.alert('Initialization Error', 'Failed to initialize the model.');
      }
    };

    initialize();
  }, []);

  const handleTrainModel = async () => {
    try {
      await mlEngine.trainModel(setTrainingStatus);
    } catch (error) {
      Alert.alert('Training Error', 'Failed to train the model.');
    }
  };

  const handleMakePrediction = async () => {
    try {
      const result = await mlEngine.makePrediction(predictionInput);
      setPredictionResult(result);
    } catch (error) {
      Alert.alert('Prediction Error', 'Failed to make prediction.');
    }
  };

  const handleResetModel = async () => {
    try {
      await mlEngine.resetModel();
      const state = mlEngine.getState();
      setIsModelLoaded(state.isModelLoaded);
      setIsModelTrained(state.isModelTrained);
      setPredictionInput('');
      setPredictionResult('');
      setTrainingStatus('');
    } catch (error) {
      Alert.alert('Reset Error', 'Failed to reset the model.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cactus</Text>

      {!isTfReady && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>Initializing TensorFlow.js...</Text>
        </View>
      )}

      {isTfReady && !isModelLoaded && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.statusText}>Loading model...</Text>
        </View>
      )}

      {isModelLoaded && (
        <View style={styles.buttonContainer}>
          <Button title="Train Model Further" onPress={handleTrainModel} />
          {trainingStatus !== '' && <Text style={styles.statusText}>{trainingStatus}</Text>}
        </View>
      )}

      {isModelLoaded && (
        <View style={styles.predictionContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter a number"
            keyboardType="numeric"
            value={predictionInput}
            onChangeText={setPredictionInput}
          />
          <Button title="Predict" onPress={handleMakePrediction} />
          {predictionResult !== '' && (
            <Text style={styles.predictionText}>Prediction: {predictionResult}</Text>
          )}
          <Button title="Reset Model" onPress={handleResetModel} color="#FF0000" />
        </View>
      )}
    </View>
  );
};

export default App;