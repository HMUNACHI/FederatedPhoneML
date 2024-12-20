import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function registerForPushNotificationsAsync() : Promise<void | null> {
  const session = await AsyncStorage.getItem('user_session');
  if (session) {
    const parsedSession = JSON.parse(session);
    const user_id = parsedSession.user.id;
    const access_token = parsedSession.access_token
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.error('Failed to get push notification permissions!');
      return null;
    }

    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
    if (pushToken) {
      try {
        const response = await fetch('https://qunrxbelodkkjibgrvnz.supabase.co/rest/v1/tokens?on_conflict=user_id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            Prefer: 'resolution=merge-duplicates', // UPSERTs instead of INSERTing (requires user_id to be unique)
          },
          body: JSON.stringify({
            token: pushToken,
            user_id: user_id,
          }),
        });
        if (!response.ok) {
          console.error('Failed to save push token to Supabase:', response.statusText);
        } else {
          console.log('Push token saved successfully.');
        }
      } catch (error) {
        console.error('Error saving push token to Supabase:', error);
      }
    } else {
      console.log('Unable to register for push notifications! TODO: Handle missing permission');
    }
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupNotificationListeners = () => {
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    // Handle the notification
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response received:', response);
    // Handle notification tap or interaction
  });
};