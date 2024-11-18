import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import LoginScreen from './components/Login';
import { checkSession, onAuthStateChange, handleLogout } from './components/Outh';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const isLoggedIn = await checkSession();
      setIsLoggedIn(isLoggedIn);
    };
    
    initSession();

    const cleanup = onAuthStateChange((isLoggedIn) => setIsLoggedIn(isLoggedIn));
    
    return cleanup;
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the App!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    color: '#333',
  },
});

export default App;
