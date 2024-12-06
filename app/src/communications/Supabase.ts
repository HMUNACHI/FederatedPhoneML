import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export async function insertRow(table: string, data: Record<string, any>): Promise<void> {
    // Inserts any data object into a specified supabase table
    try {
      const { error } = await supabase.from(table).insert([data]);
      if (error) {throw error;}
      console.log(`Row inserted successfully into ${table}`);
    } catch (err) {
      console.error('Error inserting row:', err);
    }
}

export async function updateTableRows(
  table: string,
  criteria: Record<string, any>,
  updates: Record<string, any>
): Promise<void> {
  // Updates any row(s) in a specified supabase table based on criteria
  // criteria is an object that specifies row conditions. Example: {id: 1, user_id: 2}
  // updates is an object that will update the row(s) matching the condition. Example: {status: "unavailable"}
  try {
    const { error } = await supabase.from(table).update(updates).match(criteria);
    if (error) {throw error;}
    console.log(`Row(s) updated successfully in ${table}`);
  } catch (err) {
    console.error('Error updating row(s):', err);
  }
}

export async function fetchDeviceAvailability(): Promise<string | void>{
  // This function is called after initial login, to know in what state the toggle was last left
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (!sessionError){
      const { data: latestAvailability, error: availabilityLoadError } = await supabase
      .from('devices')
      .select('status') 
      .eq('user_id', sessionData.session?.user.id)
      .limit(1); 
      
      if (!availabilityLoadError){
      return latestAvailability[0].status
      }
  }
}

export async function setDeviceAvailability ( deviceAvailability:string ): Promise<boolean>{
  // returns success boolean
  console.log(`Changing device availability to ${deviceAvailability}`);
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (!sessionError){
    const { data, error } = await supabase
      .from('devices')
      .update({ status: deviceAvailability, last_updated: new Date() })
      .eq('user_id', sessionData.session?.user.id); 
      if (error){
         error;
      }
    return true;
  }
  return false;
}

export const registerDeviceWithSupabase = async () => {
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