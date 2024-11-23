import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { handleLogin } from './Outh';
import { AuthStyles } from '../styles/Style';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLoginPress = async () => {
    try {
      await handleLogin(email, password);
    } catch (error: any) {
      console.log(error.message)
    }
  };

  return (
    <View style={AuthStyles.container}>
      <Text style={AuthStyles.title}>Login</Text>
      <TextInput
        style={AuthStyles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={AuthStyles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={onLoginPress} />
    </View>
  );
};

export default LoginScreen;
