import React, { useState } from 'react';
import { Alert } from 'react-native';
import SectionBreak from './primary/SectionBreak';
import { Image } from 'react-native';
import CactusLogo from "../assets/images/logo_light_grey.png"
import StyledTextField from './primary/TextField';
import Typography from './primary/Typography';
import CustomButton from './primary/Button';

import { handleLogin } from './Outh';
import theme from '../styles/theme';

import styled from 'styled-components/native';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false)

  const onLoginPress = async () => {
    setLoadingAuth(true)
    try {
      await handleLogin(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
    setLoadingAuth(false)
  };

  return (
    <StyledAuthView>
      <Image source={CactusLogo} style={{height: 120, width: 120}}/>
      <Typography variant='h2' style={{paddingTop: 30, paddingBottom: 30}}>Sign in</Typography>
      <StyledTextField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <StyledTextField
        secureTextEntry={true}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <CustomButton customVariant='primary' onPress={onLoginPress} loading={loadingAuth}>Sign in</CustomButton>
      <SectionBreak>or</SectionBreak>
    </StyledAuthView>
  );
};

const StyledAuthView = styled.View`
  flex: 1;
  justify-content: top;
  align-items: center;
  padding: 40px 30px; /* Top and Bottom 40px; Left and Right = 20px */
  background-color: ${theme.colors.background};
`;

export default LoginScreen;
