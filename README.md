<p align="center">
  <img src="assets/logo.png" alt="Alt text"/>
</p>

# Installation
- Run `cd python`
- Install the package `pip install -e .`
- Then run `python test.py` (edit if necessary)

```python
from mfl import keras, Trainer

model = keras.Sequential([
    keras.layers.Input(shape=(1,)), 
    keras.layers.Dense(units=1)   
])
model.compile(optimizer='sgd', loss='mean_squared_error')

# Only additional code needed
trainer = Trainer(
    model, inputs, outputs,
    batch_size=2,
)
trainer.fit(epochs=10)
```



## Installation

1. Clone the repository
2. Install dependencies:
```bash
yarn
```
3. Spin up the app on Expo
```bash
yarn start
```

### iOS Setup
```bash
cd ios
pod install
cd ..
yarn 
yarn start 
i
```

### Android Setup
No additional steps required after npm install.

## Running the App

### Spin-up on Expo
```bash
yarn start 
```

### iOS
```bash
i
```

### Android
```bash
a
```

## Ferra Features

- Distributed ML training with gradient accumulation, via Federation
- Memory-efficient batch processing
- Real-time model evaluation
- Mobile-optimized inference
- Automatic resource management
- Comprehensive error handling

## How to use Ferra
```typescript
import {isAvailable, train, evaluate, predict} from './ferra';

const sendConfig = await train(recieveConfig);

const sendConfig = await evaluate(recieveConfig);

const sendConfig = await predict(recieveConfig); 

const isAvailable = await isAvailable(); // returns true or false
```

### Configuration Types
These are JSONs Cactus APP recieves from Cactus Library,and what it returns.
Just use ferra as shown above, do not modify the codes.

#### ReceiveConfig
```typescript
interface ReceiveConfig {
  modelJson: string;                 // Model URL
  weights: [shardFileName: string]; // Model weights
  batchSize: number;                // Micro-batch size
  inputs: number[][];               // Input data
  inputShape: number[];             // Input tensor shape
  outputs?: number[][];             // Output data
  outputShape?: number[];           // Output tensor shape
  epochs?: number;                  // Training epochs
  datasetsPerDevice?: number;       // Device batch size
}
```

#### SendConfig
```typescript
interface SendConfig {
  weights: Float32Array[];      // Updated weights
  outputs?: Float32Array[];     // Predictions
  loss: number;                 // Loss value
}
```

## Technical Considerations

### Memory Management
- Automatic tensor disposal
- Batch-wise data processing
- Mobile-optimized resource handling
- Automatic cleanup on errors

### Mobile-Specific Considerations
- Limited device memory
- Battery consumption awareness
- Background processing limitations
- Network bandwidth optimization

### Performance Notes
- WebGL performance varies by device
- Model size impacts load time
- Battery usage during training
- Network latency handling
