import React, { useState, useEffect } from 'react';
import { View, Button } from 'react-native';
import { SafeAreaView } from 'react-native';
import { ThemeProvider } from 'styled-components/native';

import { isAvailable, train, evaluate, predict } from './ferra';
import { listenToTrainingMessages } from './communications/Sockets';
import { supabase } from './communications/Supabase';
import { insertNewRowAndGetId } from './communications/Sockets';
import Home from './components/Home';
import { AuthPage } from './auth/AuthPage';
import { styledTheme } from './styles/theme';
import theme from './styles/theme';

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null); // State to store the saved ID

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data?.session);
    };

    checkAuth();

    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    // Cleanup function to unsubscribe from the auth state listener
    return () => {
      authSubscription?.subscription?.unsubscribe();
    };
  }, []);

  const toggleListener = async () => {
    if (isListening) {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      setIsListening(false);
    } else {
      // Call the insertRowAndGetId function and save the returned ID
      const id = await insertNewRowAndGetId();
      if (id) {
        console.log('Saved ID:', id);
        setSavedId(id); // Save the ID to state
      }

      const unsubscribeFn = listenToTrainingMessages(async (payload) => {
        console.log('Real-time update:', payload);
        const updatedColumns = Object.keys(payload.new || {}).filter(
          (key) => payload.new[key] !== payload.old[key]
        );
        const columnHandlers: Record<string, (config: any) => Promise<any>> = {
          train_request: train,
          evaluate_request: evaluate,
          predict_request: predict,
        };
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

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  return (
    <SafeAreaView  style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ThemeProvider theme={styledTheme}>
            <Home/>
        </ThemeProvider>
    </SafeAreaView>
  );
};

export default App;
