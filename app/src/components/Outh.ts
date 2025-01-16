import { supabase } from '../communications/Supabase';
import { Session } from '@supabase/supabase-js';
import { registerOrRetrieveDeviceFromSupabase } from '../communications/Supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkSession = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

export const saveSession = async (session: object) => {
  // this function saves the user session to an encrypted async storage for later retrieval.
  // this is implemented to avoid having the user need to log in each time the app is quit & re-opened
  try {
    await AsyncStorage.setItem('user_session', JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const restoreSession = async () => {
  // this function retrieves the user session from an encrypted async storage (see saveSession method)
  // this is implemented to avoid having the user need to log in each time the app is quit & re-opened
  try {
    const session = await AsyncStorage.getItem('user_session');
    if (session) {
      const parsedSession = JSON.parse(session);
      await supabase.auth.setSession(parsedSession);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error restoring session:', error);
    return false;
  }
};

export const clearSession = async () => {
  // this function clears the user session from an encrypted async storage
  // this should be called each time the user is logged out
  try {
    await AsyncStorage.removeItem('user_session');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const onAuthStateChange = (
  callback: (isLoggedIn: boolean, session: Session | null) => void
) => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(!!session, session);
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
};

export const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    console.log('User logged out successfully.');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

export const handleLogin = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    } else {
      // we should await, otherwise realtime subscription is faster than the device ID fetch and we try to listen to an undefied device ID
      await registerOrRetrieveDeviceFromSupabase() 
    }
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};
