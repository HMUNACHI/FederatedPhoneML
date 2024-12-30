import React, { useState, useEffect } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { styledTheme } from './styles/theme';
import { ThemeProvider } from 'styled-components/native';
import LoginScreen from './components/Login';
import SignupScreen from './components/Signup';
import HomePage from './components/Home';
import { restoreSession, saveSession, clearSession } from './components/Outh';
import { useKeepAwake } from 'expo-keep-awake';
import {
  checkSession,
  onAuthStateChange,
} from './components/Outh';

import theme from './styles/theme';

const App = () => {
  useKeepAwake();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  
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

  const renderAuthScreen = () => {
    // This is a semi-retarded routing implementation, but is OK for MVP purposes and lets us avoid 
    // installing more libraries like react-navigation/native-stack
    if (authScreen === 'login') {
      return <LoginScreen setLoginInProgress={setLoginInProgress} switchToRegister={() => setAuthScreen('register')} />;
    } else if (authScreen === 'register') {
      return <SignupScreen setLoginInProgress={setLoginInProgress} switchToLogin={() => setAuthScreen('login')} />;
    }
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView  style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ThemeProvider theme={styledTheme}>
            {(isLoggedIn && !loginInProgress) ? <HomePage/> : renderAuthScreen()}
          </ThemeProvider>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default App;