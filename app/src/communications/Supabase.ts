import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const listenToTrainingMessages = (
    onUpdateCallback: (payload: any) => void,
    tableName: string,
    id: string
  ) => {
    const channel = supabase
      .channel(tableName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `id=eq.${id}`,
        },
        (payload) => {
          onUpdateCallback(payload);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  };
  

export const updateRowByIdAndColumn = async (
  id: string,
  columnName: string,
  newValue: any,
  tableName: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ [columnName]: newValue })
      .eq('id', id);

    if (error) {
      console.error('Error updating row:', error.message);
      throw new Error(`Failed to update row: ${error.message}`);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    throw err;
  }
};

export const insertNewRowAndGetId = async (
  tableName: string
): Promise<string | null> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error fetching user ID:', authError);
      return null;
    }

    const userId = user.id;

    const { data, error } = await supabase
      .from(tableName)
      .insert([
        {
          user_id: userId,
          device_status: 'active',
        },
      ])
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
