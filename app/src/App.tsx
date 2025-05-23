import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { styledTheme } from './styles/theme';
import { ThemeProvider } from 'styled-components/native';
import LoginScreen from './components/Login';
import HomePage from './components/Home';
import { restoreSession, saveSession, clearSession } from './components/Outh';
import { checkSession, onAuthStateChange } from './components/Outh';
import { useKeepAwake } from 'expo-keep-awake'; 
import theme from './styles/theme';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);

  useKeepAwake();

  useEffect(() => {
    const initSession = async () => {
      const restored = await restoreSession();
      if (!restored) {
        const isLoggedInA = await checkSession();
        setIsLoggedIn(isLoggedInA);
      } else {
        setIsLoggedIn(true);
      }
    };

    initSession();

    const cleanup = onAuthStateChange(async (isLoggedIn, session) => {
      setIsLoggedIn(isLoggedIn);

      if (isLoggedIn && session) {
        await saveSession(session);
        setLoginInProgress(false);
      } else if (!isLoggedIn) {
        await clearSession();
      }
    });

    return cleanup;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemeProvider theme={styledTheme}>
        {isLoggedIn && !loginInProgress ? (
          <HomePage />
        ) : (
          <LoginScreen setLoginInProgress={setLoginInProgress} />
        )}
      </ThemeProvider>
    </SafeAreaView>
  );
};

export default App;
