# Mobile Federated Learning

<p align="center">
  <img src="assets/logo.png" alt="FederatedPhoneML Logo"/>
</p>

A mobile-first framework for distributed machine learning on phones, enabling on-device training via federated learning using a Python SDK.

## Table of Contents

1. [Technical Design, Benefits, and Limitations](#technical-design-benefits-and-limitations)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
   - [Supabase Setup](#supabase-setup)
   - [Python SDK](#python-sdk)
   - [Mobile App (Expo)](#mobile-app-expo)
5. [Usage](#usage)
   - [Python SDK](#python-sdk-usage)
   - [React Native App](#react-native-app-usage)
6. [API Reference](#api-reference)
   - [ReceiveConfig](#receiveconfig)
   - [SendConfig](#sendconfig)
7. [Technical Considerations](#technical-considerations)
8. [Performance Notes](#performance-notes)
9. [Contributing](#contributing)
10. [License](#license)

## Technical Design, Benefits, and Limitations

### Core Design

FederatedPhoneML is a distributed machine learning framework enabling on-device training via federated learning on mobile phones. The architecture consists of:

1. **Python SDK**: Server-side coordination layer using Keras for model definition
2. **Mobile Client**: React Native app with TensorFlow.js that executes training locally
3. **Coordination Backend**: Supabase for task distribution and weight aggregation

Training occurs directly on users' devices rather than centralizing data collection. The system sends model architecture and initial weights to phones, which perform local training iterations on device-specific data, then return only the updated weights.

### Technical Benefits

1. **Data Privacy**: Raw training data never leaves user devices; only model weight updates are transmitted
2. **Bandwidth Efficiency**: Transmitting model weights requires significantly less bandwidth than raw data transfer
3. **Distributed Computation**: Leverages computational resources across many devices rather than centralized servers
4. **Heterogeneous Data Utilization**: Captures diverse training signals from varied user environments and behaviors
5. **Battery-Aware Processing**: Implements batch-wise processing to manage memory constraints on mobile devices

### Technical Limitations

1. **Resource Constraints**: Mobile devices have limited RAM and computational power, restricting model complexity
2. **Battery Consumption**: On-device training significantly increases energy usage, requiring careful optimization
3. **Training Latency**: Federation rounds are limited by slowest devices and network conditions
4. **Model Size Limitations**: TensorFlow.js imposes practical limits on model architecture complexity
5. **Heterogeneous Performance**: Training behavior varies across device hardware, potentially introducing bias
6. **WebGL Limitations**: Backend acceleration varies significantly across mobile GPUs
7. **Synchronization Challenges**: Coordination of model versions across devices with intermittent connectivity
8. **Security Vulnerabilities**: Weight updates can potentially leak information about training data

### Implementation Constraints

1. Limited to Keras/TensorFlow models with specific serialization requirements
2. TensorFlow.js performance varies significantly across browsers and devices
3. Tensor cleanup requires explicit memory management to prevent leaks
4. No differential privacy implementation yet to fully protect against inference attacks
5. Limited support for asynchronous federated learning when devices have variable availability

## Features

- Distributed federated training with gradient accumulation
- Memory-efficient batch processing
- Real-time model evaluation and inference on mobile
- Automatic resource management and tensor cleanup
- Comprehensive error handling and fallback support

## Prerequisites

- Node.js (>= 14.x)
- Yarn (>= 1.x)
- Python (>= 3.7)
- expo-cli (for React Native)
- CocoaPods (for iOS dependencies)
- [Supabase](https://supabase.com) account (for backend services)

## Installation

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Create a `.env` file in the app root with:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Create these tables in your Supabase database:
   ```sql
   -- Devices table
   CREATE TABLE devices (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES auth.users NOT NULL,
     status VARCHAR(20) NOT NULL,
     last_updated TIMESTAMPTZ
   );

   -- Task Requests table
   CREATE TABLE task_requests (
     id SERIAL PRIMARY KEY,
     device_id INTEGER REFERENCES devices(id) NOT NULL,
     request_type VARCHAR(20) NOT NULL,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Task Responses table
   CREATE TABLE task_responses (
     id SERIAL PRIMARY KEY,
     task_id INTEGER REFERENCES task_requests(id) NOT NULL,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

### Python SDK

1. Navigate to the SDK folder:
   ```bash
   cd python
   ```2. Install in editable mode:
   ```bash
   pip install -e .
   ```

### Mobile App (Expo)

1. Install dependencies:
   ```bash
   yarn
   ```
2. Start the Expo development server:
   ```bash
   yarn start
   ```

#### iOS Setup

```bash
cd ios
pod install
cd ..
yarn
yarn start
i
```

#### Android Setup

```bash
yarn start
a
```

## Usage

### Python SDK Usage

```python
from mfl import keras, Trainer

# Define a simple model
model = keras.Sequential([
  keras.layers.Input(shape=(1,)),
  keras.layers.Dense(units=1)
])
model.compile(optimizer='sgd', loss='mean_squared_error')

# Prepare training data
inputs = [[...]]
outputs = [[...]]

# Initialize federated Trainer
trainer = Trainer(
  model,
  inputs,
  outputs,
  batch_size=2
)

# Train for 10 epochs
trainer.fit(epochs=10)
```

### React Native App Usage

```typescript
import { isAvailable, train, evaluate, predict } from './ml';

// Example training call
type ReceiveConfig = {
  modelJson: string;
  weights: string[];
  batchSize: number;
  inputs: number[][];
  inputShape: number[];
  outputs?: number[][];
  outputShape?: number[];
  epochs?: number;
};

async function runFederatedTraining(config: ReceiveConfig) {
  if (await isAvailable()) {
    const sendConfig = await train(config);
    console.log('Updated weights:', sendConfig.weights);
    console.log('Loss:', sendConfig.loss);
  } else {
    console.warn('Federated learning not available on this device.');
  }
}
```

## API Reference

### ReceiveConfig

```typescript
interface ReceiveConfig {
  modelJson: string;       // URL to the model JSON manifest
  weights: string[];       // Array of weight shard file names
  batchSize: number;       // Micro-batch size for local training
  inputs: number[][];      // Local input data array
  inputShape: number[];    // Shape of the input tensor
  outputs?: number[][];    // Local output data (for training/evaluation)
  outputShape?: number[];  // Shape of the output tensor
  epochs?: number;         // Number of local training epochs
  datasetsPerDevice?: number; // Number of batches per device
}
```

### SendConfig

```typescript
interface SendConfig {
  weights: Float32Array[]; // Updated model weights after operation
  outputs?: Float32Array[]; // Predictions (for evaluate/predict)
  loss: number;           // Loss value after training
}
```

## Technical Considerations

- **Automatic Tensor Disposal:** Prevents memory leaks by disposing of unused tensors.
- **Batch-wise Processing:** Optimizes memory usage on resource-constrained devices.
- **Error Handling:** Graceful cleanup and retry strategies on failures.
- **Background Limits:** Adheres to mobile OS restrictions for background tasks.
- **Network Optimization:** Minimizes bandwidth usage during federated communication.

## Performance Notes

- WebGL performance and model size can impact load/inference times.
- Battery consumption rises during on-device training; monitor usage.
- Network latency affects federated rounds; consider compression.
- iOS and Android hardware differences may yield variable performance.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Implement your changes and commit.
4. Push to your fork: `git push origin feature/my-feature`.
5. Open a pull request describing your changes.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
