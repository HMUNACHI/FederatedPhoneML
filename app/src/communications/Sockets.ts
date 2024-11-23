import { evaluate, predict, train } from '../ferra';
import { listenToTrainingMessages } from './Supabase';

let unsubscribeFromUpdates: (() => void) | null = null;

const TABLE_NAME = 'training_messages';

const columnHandlers: Record<string, (config: any) => Promise<any>> = {
  train_request: train,
  evaluate_request: evaluate,
  predict_request: predict,
};

export function joinNetwork() {
  if (unsubscribeFromUpdates) {
    console.warn('Already listening to the network.');
    return;
  }

  console.log('Joining the network...');
  try {
    unsubscribeFromUpdates = listenToTrainingMessages(async (payload) => {
      try {
        await handleTrainingMessageUpdate(payload);
      } catch (error) {
        console.error('Error handling training message update:', error);
      }
    }, TABLE_NAME);
    console.log('Successfully joined the network.');
  } catch (error) {
    console.error('Error during listenToTrainingMessages setup:', error);
  }
}

export function leaveNetwork() {
  if (!unsubscribeFromUpdates) {
    console.warn('Not currently listening to the network.');
    return;
  }

  console.log('Leaving the network...');
  try {
    unsubscribeFromUpdates();
    unsubscribeFromUpdates = null;
    console.log('Successfully left the network.');
  } catch (error) {
    console.error('Error during unsubscribeFromUpdates:', error);
  }
}

const handleTrainingMessageUpdate = async (payload: any) => {
  try {
    if (!payload.new || !payload.old) {
      console.error('Invalid payload structure:', payload);
      return;
    }

    const updatedColumns = Object.keys(payload.new).filter(
      (key) => payload.new[key] !== payload.old[key]
    );

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
  } catch (error) {
    console.error('Unhandled error in handleTrainingMessageUpdate:', error);
  }
};
