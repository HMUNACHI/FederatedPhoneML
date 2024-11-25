import { evaluate, isAvailable, predict, train } from '../ferra';
import {
  insertNewRowAndGetId,
  listenToTrainingMessages,
  updateRowByIdAndColumn,
} from './Supabase';

let unsubscribeFromUpdates: (() => void) | null = null;

const TABLE_NAME = 'training_messages';

const DEVICE_STATUS_COLUMN = 'device_status';

const DEVICE_PULSE_COLUMN = 'device_pulse';

let sessionId: null | string;

let intervalId: NodeJS.Timeout | null = null;

const columnHandlers: Record<string, (config: any) => Promise<any>> = {
  training_request: train,
  evaluate_request: evaluate,
  predict_request: predict,
};

const responseColumns: Record<string, string> = {
  training_request: 'training_response',
  evaluate_request: 'evaluate_response',
  predict_request: 'predict_response',
};

export async function joinNetwork() {
  try {
    sessionId = await insertNewRowAndGetId(TABLE_NAME);
  } catch (error) {
    console.error('Error inserting a new row and getting session ID:', error);
    return;
  }

  if (sessionId == null) {
    return;
  }

  console.log('Joining the network...');
  try {
    unsubscribeFromUpdates = listenToTrainingMessages(
      async (payload) => {
        try {
          await handleTrainingMessageUpdate(payload);
        } catch (error) {
          console.error('Error handling training message update:', error);
        }
      },
      TABLE_NAME,
      sessionId
    );
    console.log('Successfully joined the network.');

    intervalId = setInterval(async () => {
      try {
        pollTable();
      } catch (error) {
        console.error('Error during periodic function execution:', error);
      }
    }, 10000);
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
  updateTableOnDeviceLeaving();
}

function updateTableOnDeviceLeaving() {
  if (sessionId == null) {
    console.warn('No device session!');
    return;
  }

  updateRowByIdAndColumn(
    sessionId,
    DEVICE_STATUS_COLUMN,
    'inactive',
    TABLE_NAME
  );
}

function pollTable() {
  if (sessionId == null) {
    console.warn('No device session!');
    return;
  }

  updateRowByIdAndColumn(
    sessionId,
    DEVICE_PULSE_COLUMN,
    new Date().toISOString(),
    TABLE_NAME
  );
}

const handleTrainingMessageUpdate = async (payload: any) => {
  try {
    if (!isAvailable) {
      console.warn('Device is not available!');
      return;
    }

    if (sessionId == null) {
      console.warn('No device session!');
      return;
    }

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
        try {
          const result = await handler(payload.new[column]);
          console.log(`${column} result:`, result);
          updateRowByIdAndColumn(
            sessionId,
            responseColumns[column],
            result,
            TABLE_NAME
          );
        } catch (error) {
          console.error(`Error during ${column}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Unhandled error in handleTrainingMessageUpdate:', error);
  }
};
