import { supabase } from "../communications/Supabase";
import { View, Button, Text } from 'react-native';

export const AuthPage: React.FC = () => {
    const signInWithEmail = async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'password123',
      });
    };
  
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>Please log in to continue</Text>
        <Button title="Sign In" onPress={signInWithEmail} />
      </View>
    );
  };
  