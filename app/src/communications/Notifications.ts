import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { getCurrentDeviceID } from 'src/utils/CurrentDevice';

export async function registerForPushNotificationsAsync() : Promise<void | null> {
  const session = await AsyncStorage.getItem('user_session');
  const device_id = await getCurrentDeviceID()
  console.log(`Fetched async device id ${device_id} in Notifications.ts`)
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

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.log('Project ID not found')
    //   Sentry.captureMessage('Project ID not found', "error");
    }else{
      console.log(`Project ID loaded: ${projectId}`);
    //   Sentry.captureMessage(`Project ID loaded: ${projectId}`, "log");
    }
    const pushToken = (await Notifications.getExpoPushTokenAsync({
      projectId
    })).data;
    if (pushToken) {
      console.log(`Push token obtained: ${pushToken}`);
      try {
        const response = await fetch('https://qunrxbelodkkjibgrvnz.supabase.co/rest/v1/tokens?on_conflict=device_id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            Prefer: 'resolution=merge-duplicates', // UPSERTs instead of INSERTing (requires device_id to be unique)
          },
          body: JSON.stringify({
            token: pushToken,
            device_id: device_id
          }),
        });
        if (!response.ok) {
          console.error('Failed to save push token to Supabase:', response.statusText);
        } else {
          console.log(`Push token saved successfully.`);
        //   Sentry.captureMessage(`Push token saved successfully.`, "log");
        }
      } catch (error) {
        console.log(`Error saving push token to Supabase: ${error}`);
        // Sentry.captureMessage(`Error saving push token to Supabase: ${error}`, "error");
      }
    } else {
      console.log(`Unable to register for push notifications! TODO: Handle missing permission`);
    //   Sentry.captureMessage(`Unable to register for push notifications! TODO: Handle missing permission`, "error");
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
    // Sentry.captureMessage(`Notification received: ${notification}`, "log");
    // Handle the notification
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    // Sentry.captureMessage(`Notification response received: ${response}`, "log");
    // Handle notification tap or interaction
  });
};