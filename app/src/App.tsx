import { isAvailable, train, evaluate, predict } from './ferra';
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
      const unsubscribeFn = listenToTrainingMessages(async (payload) => {
        console.log('Real-time update:', payload);
  
        // Handle updates for specific columns
        const updatedColumns = Object.keys(payload.new || {}).filter(
          (key) => payload.new[key] !== payload.old[key]
        );
  
        // Define a mapping of column names to their handlers
        const columnHandlers: Record<string, (config: any) => Promise<any>> = {
          train_request: train,
          evaluate_request: evaluate,
          predict_request: predict,
        };
  
        // Process each updated column
        for (const column of updatedColumns) {
          const handler = columnHandlers[column];
          if (handler) {
            console.log(`${column} changed:`, payload.new[column]);
            try {
              const result = await handler(payload.new[column]?.config);
              console.log(`${column} result:`, result);
            } catch (error) {
              console.error(`Error during ${column}:`, error);
            }
          } else {
            console.log(`Other column changed: ${column}`);
          }
        }
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
