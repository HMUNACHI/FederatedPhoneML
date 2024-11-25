import { supabase, insertRow } from '../communications/Supabase';
import { leaveNetwork } from '../communications/Sockets';

export const checkSession = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

export const onAuthStateChange = (callback: (isLoggedIn: boolean) => void) => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(!!session);
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

const registerDeviceWithSupabase = async () => {
  // https://www.notion.so/TODO-Engineering-reminders-148d8e920c9780fb8af0c558296e1bd2?pvs=4#148d8e920c9780cea520d862b57c2f1c
  try {
    // Step 1: Get the user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }
    const user_id: string | undefined = sessionData.session?.user.id;
    if (!user_id) {
      throw new Error('User session is invalid or user ID is missing.');
    }
    // Step 2: Check whether this user already has a registered device
    const { data: deviceData, error: tableLoadError } = await supabase
      .from('devices')
      .select('id') 
      .eq('user_id', user_id)
      .limit(1); 

    if (tableLoadError) {
      throw tableLoadError;
    }

    // Step 3. only register this device if there's no device record for this user yet
    if (deviceData && deviceData.length === 0) {
      await insertRow('devices', {
          user_id: user_id,
          status: 'available',
          last_updated: new Date(),
        },
      );
    }
  } catch (err) {
    console.error('Error registering device with Supabase:', err);
  }
}

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
      registerDeviceWithSupabase()
    }
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};
