import React, { useState, useEffect } from 'react';
import { Text, View, Button } from 'react-native';
import LoginScreen from './components/Login';
import {
  checkSession,
  onAuthStateChange,
  handleLogout,
} from './components/Outh';
import { HomeStyles } from './styles/Style';
import { joinNetwork, leaveNetwork } from './communications/Sockets';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deviceActive, setDeviceActive] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const isLoggedIn = await checkSession();
      setIsLoggedIn(isLoggedIn);
    };

    initSession();

    const cleanup = onAuthStateChange((isLoggedIn) =>
      setIsLoggedIn(isLoggedIn)
    );

    return cleanup;
  }, []);

  const toggleDeviceStatus = () => {
    if (!deviceActive) {
      joinNetwork();
    } else {
      leaveNetwork();
    }
    setDeviceActive((prevState) => !prevState);
  };

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <View style={HomeStyles.container}>
      <Text style={HomeStyles.text}>Welcome to the App!</Text>
      <Button title="Logout" onPress={handleLogout} />
      <Button
        title={deviceActive ? 'Leave Network' : 'Join Network'}
        onPress={toggleDeviceStatus}
      />
      <Text style={HomeStyles.text}>
        {deviceActive
          ? 'You have joined the network!'
          : 'You are not part of the network.'}
      </Text>
    </View>
  );
};

export default App;
