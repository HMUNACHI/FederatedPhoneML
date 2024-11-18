import { supabase } from '../communications/Supabase';

export const checkSession = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

export const onAuthStateChange = (callback: (isLoggedIn: boolean) => void) => {
  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });

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

export const handleLogin = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
};