import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { styledTheme } from './styles/theme';
import { ThemeProvider } from 'styled-components/native';
import LoginScreen from './components/Login';
import HomePage from './components/Home';
import { restoreSession, saveSession, clearSession } from './components/Outh';
import {
  checkSession,
  onAuthStateChange,
} from './components/Outh';
import { registerForPushNotificationsAsync, setupNotificationListeners } from './communications/Notifications';

import theme from './styles/theme';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  
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
        await registerForPushNotificationsAsync();
        setupNotificationListeners()
        setLoginInProgress(false);
      } else if (!isLoggedIn) {
        await clearSession();
      }
    });
  
    return cleanup;
  }, []);

  return (
    <SafeAreaView  style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ThemeProvider theme={styledTheme}>
            {(isLoggedIn && !loginInProgress) ? <HomePage/> : <LoginScreen setLoginInProgress={setLoginInProgress} />}
            {/* <HomePage/> */}
        </ThemeProvider>
    </SafeAreaView>
  );
};

export default App;