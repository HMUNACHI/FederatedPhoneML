import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { View, Text, TextInput, Button } from 'react-native';
import { Image } from 'react-native';
import CactusLogo from "../assets/images/logo_light_grey_no_glow.png"
import StyledTextField from './primary/TextField';

import { handleLogin } from './Outh';
import theme from '../styles/theme';

import styled from 'styled-components/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLoginPress = async () => {
    try {
      await handleLogin(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <StyledAuthView>
      <Image source={CactusLogo} style={{height: 120, width: 120}}/>
      <Text>Login</Text>
      <StyledTextField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <StyledTextField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={onLoginPress} />
    </StyledAuthView>
  );
};

const StyledAuthView = styled.View`
  box-sizing: border-box;
  flex: 1;
  width: auto; /* Adjusted for React Native, since 'fit-content' is not supported */
  height: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: center;
  align-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 20px;
  padding: 40px 20px; /* Top and Bottom 40px; Left and Right = 20px */
  position: relative;
  background-color: ${theme.colors.background};
`;

export default LoginScreen;
