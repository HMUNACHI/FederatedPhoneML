import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { styledTheme } from './styles/theme';
import { ThemeProvider } from 'styled-components/native';
import LoginScreen from './components/LoginScreen';
import HomePage from './components/HomePage';
import theme from './styles/theme';

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

  return (
    <SafeAreaView  style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ThemeProvider theme={styledTheme}>
            {isLoggedIn ? <HomePage/> : <LoginScreen />}
        </ThemeProvider>
    </SafeAreaView>
  );
};

export default App;