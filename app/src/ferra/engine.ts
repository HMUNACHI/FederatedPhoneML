// engine.ts
import * as tf from '@tensorflow/tfjs';
import { getConfig, sendWeights, getWeights } from './communications';
import { episode } from './trainer';
import { initializeTf } from './tensorflowInitializer';
import { loadModel } from './modelHandler';

interface ModelState {
  model: tf.LayersModel | null;
  isTfReady: boolean;
  isModelLoaded: boolean;
  isModelTrained: boolean;
}

export class MLEngine {
  private state: ModelState = {
    model: null,
    isTfReady: false,
    isModelLoaded: false,
    isModelTrained: false
  };

  async initialize(): Promise<ModelState> {
    try {
      await initializeTf();
      this.state.isTfReady = true;

      const serverUrl = 'http://0.0.0.0:8000/get-config';
      const config = await getConfig(serverUrl);
      this.state.config = config;
      
      if (!config) {
        throw new Error('Failed to fetch configuration');
      }
      
      const loadedModel = await loadModel(config);
      this.state.model = loadedModel;
      this.state.isModelLoaded = true;
      this.state.isModelTrained = true;
      
      return { ...this.state };
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  async trainModel(
    setTrainingStatus: React.Dispatch<React.SetStateAction<string>>
  ): Promise<void> {
    
    if (!this.state.model) {
      throw new Error('Model not initialized');
    }

    const epochs = this.state.config['epochs'];

    for (let epoch = 1; epoch <= epochs; epoch++) { 
      await episode(this.state.model, this.state.config, setTrainingStatus);
      await sendWeights(this.state.model, 'http://0.0.0.0:8000/send-weights');
      await getWeights(this.state.model, 'http://0.0.0.0:8000/get-weights');
    }
  }

  async makePrediction(input: string): Promise<string> {
    if (!this.state.model) {
      throw new Error('Model not initialized');
    }

    try {
      const inputValue = parseFloat(input);
      if (isNaN(inputValue)) {
        throw new Error('Invalid input');
      }

      const inputTensor = tf.tensor2d([inputValue], [1, 1]);
      const prediction = this.state.model.predict(inputTensor) as tf.Tensor;
      const result = await prediction.data();
      
      inputTensor.dispose();
      prediction.dispose();
      
      return result[0].toString();
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  async resetModel(): Promise<void> {
    try {
      if (this.state.model) {
        this.state.model.dispose();
      }
      
      this.state = {
        model: null,
        isTfReady: true,
        isModelLoaded: false,
        isModelTrained: false
      };
      
      await this.initialize();
    } catch (error) {
      console.error('Reset error:', error);
      throw error;
    }
  }

  getState(): ModelState {
    return { ...this.state };
  }
}

export const mlEngine = new MLEngine();