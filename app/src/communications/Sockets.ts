import { supabase } from './Supabase';

export const TABLE_NAME = 'training_messages';

export const listenToTrainingMessages = (onUpdateCallback: (payload: any) => void) => {
  const channel = supabase
    .channel(TABLE_NAME)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      (payload) => {
        console.log('Change received!', payload);
        onUpdateCallback(payload);
      }
    )
    .subscribe();

  // Return a function to unsubscribe when no longer needed
  return () => {
    supabase.removeChannel(channel);
    console.log('Unsubscribed from training_messages updates');
  };
};

export const updateRowByIdAndColumn = async (
    id: string,
    columnName: string,
    newValue: any
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ [columnName]: newValue })
        .eq('id', id);
  
      if (error) {
        console.error('Error updating row:', error.message);
        throw new Error(`Failed to update row: ${error.message}`);
      }
  
      console.log(`Row with ID ${id} successfully updated in ${TABLE_NAME}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      throw err;
    }
  };

  export const insertNewRowAndGetId = async (): Promise<string | null> => {
    try {
      // Get the current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error fetching user ID:', authError);
        return null;
      }
  
      const userId = user.id;
  
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          user_id: userId,
          timestamp: new Date().toISOString(),
          device_status: 'active', 
          device_pulse_timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ') // Timestamp without timezone
        }])
        .select('id')
        .single();
  
      if (error) {
        console.error('Error inserting row:', error);
        return null;
      }
  
      console.log('Inserted row ID:', data.id);
      return data.id;
    } catch (err) {
      console.error('Unexpected error inserting row:', err);
      return null;
    }
  };
  
  
  