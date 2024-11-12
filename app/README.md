# Overview

In progress

To run it locally:

```
$ yarn
$ yarn start
```

Then scan the QR code to open it in the `Expo Go` app.
```js
import * as tf from '@tensorflow/tfjs';
import { Config } from './communications';
import { episode } from './trainer';
import { evaluate } from './evaluator';
import { initializeTf } from './tensorflowInitializer';
import { loadModel } from './modelHandler';

interface ModelState {
  model: tf.LayersModel | null;
  isTfReady: boolean;
  isModelLoaded: boolean;
  config: Config | null;
}

class MLModelManager {
  private state: ModelState = {
    model: null,
    isTfReady: false,
    isModelLoaded: false,
    config: null,
  };

  public async sendJob(config: Config): Promise<{ weights: number[][]; loss: number }> {
    if (!this.state.isTfReady) {
      await initializeTf();
      this.state.isTfReady = true;
    }

    // Load or reset the model with the new configuration
    if (this.state.model) {
      this.state.model.dispose();
    }

    this.state.model = await loadModel(config);
    this.state.config = config;
    this.state.isModelLoaded = true;

    // Run a training episode
    const setTrainingStatus = (status: string) => console.log(status);
    const loss = await episode(this.state.model, config, setTrainingStatus);

    // Retrieve model weights
    const weights = await this.getModelWeights();

    return { weights, loss };
  }

  public async updateWeights(globalWeights: number[][]): Promise<number[][]> {
    if (!this.state.model || !this.state.config) {
      throw new Error('Model or config not initialized');
    }

    await this.updateModelWeights(globalWeights);

    // Run a training episode
    const setTrainingStatus = (status: string) => console.log(status);
    await episode(this.state.model, this.state.config, setTrainingStatus);

    // Retrieve updated weights
    const updatedWeights = await this.getModelWeights();

    return updatedWeights;
  }

  public async evaluateModel(
    inputs: number[][],
    outputs: number[][],
    globalWeights: number[][]
  ): Promise<number> {
    if (!this.state.model || !this.state.config) {
      throw new Error('Model or config not initialized');
    }

    await this.updateModelWeights(globalWeights);

    // Convert inputs and outputs to tensors
    const inputTensor = tf.tensor2d(inputs);
    const outputTensor = tf.tensor2d(outputs);

    try {
      // Run evaluation
      const loss = await evaluate(this.state.model, inputTensor, outputTensor, this.state.config);
      return loss;
    } finally {
      // Cleanup
      inputTensor.dispose();
      outputTensor.dispose();
    }
  }

  public async predict(inputs: number[][], globalWeights: number[][]): Promise<number[][]> {
    if (!this.state.model) {
      throw new Error('Model not initialized');
    }

    await this.updateModelWeights(globalWeights);

    // Convert inputs to tensor and make predictions
    const inputTensor = tf.tensor2d(inputs);
    const predictions = this.state.model.predict(inputTensor) as tf.Tensor;
    const results = await predictions.array() as number[][];

    // Cleanup
    inputTensor.dispose();
    predictions.dispose();

    return results;
  }

  private async getModelWeights(): Promise<number[][]> {
    if (!this.state.model) {
      throw new Error('Model not initialized');
    }

    const weights = this.state.model.getWeights();
    const weightData: number[][] = [];

    for (const tensor of weights) {
      const values = await tensor.array() as number[][];
      weightData.push(values);
    }

    return weightData;
  }

  private async updateModelWeights(weightData: number[][]): Promise<void> {
    if (!this.state.model) {
      throw new Error('Model not initialized');
    }

    const weightTensors = weightData.map(data => tf.tensor(data));
    this.state.model.setWeights(weightTensors);
    weightTensors.forEach(tensor => tensor.dispose());
  }

  public async dispose(): Promise<void> {
    if (this.state.model) {
      this.state.model.dispose();
      this.state.model = null;
    }
    this.state.isTfReady = false;
    this.state.isModelLoaded = false;
    this.state.config = null;
    // Add any additional cleanup if necessary
  }
}

// Example usage:

(async () => {
  const manager = new MLModelManager();

  // SEND_JOB
  const initialConfig: Config = {
    // ... your configuration settings
  };
  const { weights, loss } = await manager.sendJob(initialConfig);
  console.log('Initial training loss:', loss);
  console.log('Initial weights:', weights);

  // UPDATE_WEIGHTS
  const globalWeights: number[][] = [
    // ... your global weights
  ];
  const updatedWeights = await manager.updateWeights(globalWeights);
  console.log('Updated weights:', updatedWeights);

  // EVALUATE
  const inputs: number[][] = [
    // ... your input data
  ];
  const outputs: number[][] = [
    // ... your output data
  ];
  const evaluationLoss = await manager.evaluateModel(inputs, outputs, globalWeights);
  console.log('Evaluation loss:', evaluationLoss);

  // PREDICT
  const predictionInputs: number[][] = [
    // ... your prediction input data
  ];
  const predictions = await manager.predict(predictionInputs, globalWeights);
  console.log('Predictions:', predictions);

  // Cleanup
  await manager.dispose();
})();

```

1. SEND_JOB
   - Receives: Initial model configuration
   - Action: Runs an episode
   - Returns: Model weights and loss

2. UPDATE_WEIGHTS
   - Receives: Global weights
   - Action: Updates local model weights and runs an episode
   - Returns: New weights

3. EVALUATE
   - Receives: Inputs, outputs, and global weights
   - Action: Updates weights and performs evaluation
   - Returns: Loss value

4. PREDICT
   - Receives: Inputs and global weights
   - Action: Updates weights and runs prediction
   - Returns: Output predictions

