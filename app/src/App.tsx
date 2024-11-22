import React, { useState, useEffect } from 'react';
import { Text, View, Button } from 'react-native';
import LoginScreen from './components/Login';
import {
  checkSession,
  onAuthStateChange,
  handleLogout,
} from './components/Outh';
import { HomeStyles } from './styles/Style';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <View style={HomeStyles.container}>
      <Text style={HomeStyles.text}>Welcome to the App!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default App;
