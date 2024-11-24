import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function insertRow(table: string, data: Record<string, any>): Promise<void> {
    'Inserts any data object into a specified supabase table'
    try {
      const { error } = await supabase.from(table).insert([data]);
  
      if (error) {
        throw error;
      }
  
      console.log(`Row inserted successfully into ${table}`);
    } catch (err) {
      console.error('Error inserting row:', err);
    }
}

export async function fetchDeviceAvailability(): Promise<string>{
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
  return 'x'
}

export async function toggleDeviceAvailability( currentAvailability:string ): Promise<string | void>{
  console.log(`Received toggle request from ${currentAvailability} status`)
  const newAvailability = currentAvailability === 'available' ? 'unavailable' : 'available';
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (!sessionError){
    const { data, error } = await supabase
      .from('devices')
      .update({ status: newAvailability, last_updated: new Date() })
      .eq('user_id', sessionData.session?.user.id); 
    if (error) {
      throw error;
    }
    console.log(`Toggling to ${newAvailability}`)
    return newAvailability
  }
}