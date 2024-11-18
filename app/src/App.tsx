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
      Alert.alert('Listener turned off');
    } else {
      // Turn on the listener
      const unsubscribeFn = listenToTrainingMessages((payload) => {
        console.log('Real-time update:', payload);
        Alert.alert('Update Received', JSON.stringify(payload));
      });
      setUnsubscribe(() => unsubscribeFn);
      setIsListening(true);
      Alert.alert('Listener turned on');
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
