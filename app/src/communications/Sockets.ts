import { supabase, updateTableRows, setDeviceAvailability } from "./Supabase";
import {isAvailable, train, evaluate, predict} from '../ferra'
import { ReceiveConfig } from "../ferra/Config";

import { getCurrentDeviceID } from "../utils/CurrentDevice";

const activeSubscriptions: Record<string, any> = {}; // a basic dictionary to store active Supabase channels like {'tasks_device_1': channel}

const createRealtimeChannelName = (table:string, deviceId:string) => {
  // simple function used to generate standardized generic names for subscriptions to realtime tables
  return `${table}_device_${deviceId}`
}

async function subscribeToRealtimeTable(
    table: string,
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    callback: Function
  ): Promise<void> {
    getCurrentDeviceID().then((deviceId => {
      console.log(`received device Id ${deviceId}`)
      const channelName = createRealtimeChannelName(table, deviceId)
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: eventType,
            schema: 'public',
            table: table,
            filter: `device_id=eq.${deviceId}`
          },
          (payload: Object) => {
            callback(payload)
          }
        ).subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${table} for device_id: ${deviceId}`);
            activeSubscriptions[channelName] = channel
          }
        });
    }))
  }

export function joinNetwork() {
    subscribeToRealtimeTable(
        'tasks', 
        'INSERT',
        (payload: object) => {
            console.log('received payload ', payload)
            const taskId = payload.new.id
            const task_type = payload.new.request_type
            const requestConfig = payload.new.request_data
            handleNewFerraTask(task_type, requestConfig).then((responseData) => {
                updateTableRows(
                    'tasks',
                    {id: taskId},
                    {response_data: responseData, response_sent: new Date()}
                );
                setDeviceAvailability('available');
            })
        }
    )
}

export async function leaveNetwork() {
  getCurrentDeviceID().then((deviceId) => {
    const tableName = 'tasks';
    const channelName = createRealtimeChannelName(tableName, deviceId)
    const channel = activeSubscriptions[channelName];
    if (!channel) {
      console.log(`No active subscription found for ${tableName} and device_id: ${deviceId}`);
      return;
    }
    supabase.removeChannel(channel);
    delete activeSubscriptions[channelName]; // Clean up the subscription reference
    console.log(`Unsubscribed from ${tableName} for device_id: ${deviceId}`);
  })
}

enum TaskType {
    train = 'train',
    evaluate = 'evaluate',
    predict = 'predict',
}

async function handleNewFerraTask(
    taskType: TaskType,
    requestData: ReceiveConfig
): Promise<object | void> {
    console.log('Interpreting Ferra request...')
    setDeviceAvailability('busy')
    switch (taskType){
        case TaskType.train:
            return await train(requestData)
        case TaskType.evaluate:
            return await evaluate(requestData)
        case TaskType.predict:
            return await predict(requestData)
        default:
            console.warn(`Unhandled task type: ${taskType}`);
            return 
    }
}