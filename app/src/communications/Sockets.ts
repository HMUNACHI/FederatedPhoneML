import { supabase } from './Supabase';

export const listenToTrainingMessages = (onUpdateCallback: (payload: any) => void) => {
  const channel = supabase
    .channel('training_messages')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'training_messages' },
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
