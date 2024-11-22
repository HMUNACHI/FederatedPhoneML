# Cactus App

TensorFlow.js-powered machine learning framework for React Native, enabling distributed training and inference on mobile devices.

## Project Structure

```
.
├── src/                      # Source code 
│   ├── App.tsx               # Main application entry (Roman)
│   ├── communications/       # Network handlers (James)
│   │   ├── Sockets.ts        # Channels class (James)
│   │   └── Supabase.ts       # Supabase functions (James)
│   ├── components/           # UI Components (Roman)
│   │   ├── Login.ts          # Authentication UI (Roman)
│   │   └── Outh.ts           # OAuth implementation (Roman)
│   └── ferra/                # ML Framework Core (Henry)
│       ├── Config.ts         # Configuration handlers (Henry)
│       ├── Diagnostics.ts    # System diagnostics (Henry)
│       ├── Evaluation.ts     # Model evaluation (Henry)
│       ├── Losses.ts         # Loss functions (Henry)
│       ├── ModelHandler.ts   # Model management (Henry)
│       ├── Optimizers.ts     # Optimization algorithms (Henry)
│       ├── Prediction.ts     # Inference handling (Henry)
│       ├── Training.ts       # Training implementation (Henry)
│       └── index.ts          # Framework entry point (Henry)
├── ios/                      # iOS specific files
├── android/                  # Android specific files
├── **tests**/                # Test files
└── package.json              # Project dependencies
```

## Setup Requirements

- Node.js >= 14
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS)

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
  modelUrl: string;                 // Model URL
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

## Prettier Setup

### Step 1: Install Prettier Extension
1. Open VS Code.
2. Go to the Extensions view by pressing `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac).
3. Search for **"Prettier - Code formatter"** and click **Install**.

### Step 2: Configure Prettier in VS Code
1. Open your **Settings** by pressing `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac).
2. Search for **"Default Formatter"** and set it to `esbenp.prettier-vscode`.
3. Enable format on save:
   - Search for **"Editor: Format On Save"** in the Settings and check the box.

### Step 3: Prettier Configuration in Project
Make sure you have a `.prettierrc` file in your project root (already included in this project). The configuration for this project is:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 80
}
