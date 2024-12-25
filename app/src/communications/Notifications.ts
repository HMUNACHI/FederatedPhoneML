import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
// import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { getCurrentDeviceID } from 'src/utils/CurrentDevice';

export async function registerForPushNotificationsAsync() : Promise<void | null> {
  const session = await AsyncStorage.getItem('user_session');
  const device_id = await getCurrentDeviceID()
  console.log(`Fetched async device id ${device_id} in Notifications.ts`)
  if (session) {
    if (Platform.OS === 'android') {
      // Notifications.setNotificationChannelAsync('default', {
      //   name: 'default',
      //   importance: Notifications.AndroidImportance.MAX,
      //   vibrationPattern: [0, 250, 250, 250],
      //   lightColor: '#FF231F7C',
      // }); 
      Notifications.setNotificationChannelAsync('silent-channel', {
        name: 'Silent Channel',
        importance: Notifications.AndroidImportance.MIN,
        vibrationPattern: [0],
        sound: null,
      });
    }
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permission not granted to get push token for push notification!');
        return;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.log('Project ID not found');
      }
      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log(pushTokenString);
        console.log(`Push token obtained: ${pushTokenString}`);
        try {
          const parsedSession = JSON.parse(session);
          const access_token = parsedSession.access_token
          const response = await fetch('https://qunrxbelodkkjibgrvnz.supabase.co/rest/v1/tokens?on_conflict=device_id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
              Prefer: 'resolution=merge-duplicates', // UPSERTs instead of INSERTing (requires device_id to be unique)
            },
            body: JSON.stringify({
              token: pushTokenString,
              device_id: device_id
            }),
          });
          if (!response.ok) {
            console.error('Failed to save push token to Supabase:', response, response.statusText);
          } else {
            console.log(`Push token saved successfully.`);
          //   Sentry.captureMessage(`Push token saved successfully.`, "log");
          }
        } catch (error) {
          console.log(`Error saving push token to Supabase: ${error}`);
          // Sentry.captureMessage(`Error saving push token to Supabase: ${error}`, "error");
        }
      } catch (e: unknown) {
        console.log(`${e}`);
      }
    } else {
      console.log('Must use physical device for push notifications');
    }
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const setupNotificationListeners = () => {
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('notification received! woo: ', notification.request.content.data)
    // Sentry.captureMessage(`Notification received: ${notification}`, "log");
    // Handle the notification
    runBackgroundTask(notification.request.content.data);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('response received! woo: ', response)
    // Sentry.captureMessage(`Notification response received: ${response}`, "log");
    // Handle notification tap or interaction
  });
};

async function runBackgroundTask(dataFromPush: any) {
  try {
    // for example, call supabase
    // Make sure your user session/credentials are still available
    // so you can properly authenticate supabase calls
    // e.g.:
    // const { data, error } = await supabaseClient
    //   .from('your_table')
    //   .select('*')
    //   .eq('someColumn', dataFromPush.someValue);
    // ...
    console.log('Background task completed');
  } catch (err) {
    console.error('Error in background task:', err);
  }
}