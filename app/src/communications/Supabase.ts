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