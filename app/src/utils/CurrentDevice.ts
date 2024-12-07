import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setCurrentDeviceID(deviceId: number): Promise<void> {
    AsyncStorage.setItem('deviceId', deviceId.toString())
}

export async function getCurrentDeviceID(): Promise<string | void> {
    const deviceId = await AsyncStorage.getItem('deviceId')
    return parseInt(deviceId, 10)
}