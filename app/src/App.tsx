import {isAvailable, train, evaluate, predict} from './ferra';

import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { listenToTrainingMessages } from './communications/Sockets';

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const toggleListener = () => {
    if (isListening) {
      // Turn off the listener
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      setIsListening(false);
    } else {
      // Turn on the listener
      const unsubscribeFn = listenToTrainingMessages((payload) => {
        console.log('Real-time update:', payload);
  
        // Handle updates for specific columns
        const updatedColumns = Object.keys(payload.new || {}).filter(
          (key) => payload.new[key] !== payload.old[key]
        );
  
        updatedColumns.forEach((column) => {
          switch (column) {
            case 'train_request':
              console.log('Training request changed:', payload.new.train_request);
              break;
            case 'evaluate_request':
              console.log('Evaluate request changed:', payload.new.evaluate_request);
              break;
            case 'predict_request':
              console.log('Predict request changed:', payload.new.predict_request);
              break;
            default:
              console.log(`Other column changed: ${column}`);
              break;
          }
        });
      });
  
      setUnsubscribe(() => unsubscribeFn);
      setIsListening(true);
    }
  };
  

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Button
        title={isListening ? 'Turn Off Listener' : 'Turn On Listener'}
        onPress={toggleListener}
      />
    </View>
  );
};

export default App;
