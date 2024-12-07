import React, { useState } from 'react';
import { handleLogin } from './Outh';
import SectionBreak from './primary/SectionBreak';
import Typography from './primary/Typography';
import { Image } from 'react-native';
import CactusLogo from "../assets/images/logo_light_grey.png"
import StyledTextInput from './primary/TextField';
import CustomButton from './primary/Button';

import theme from '../styles/theme';
import styled from 'styled-components/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadingAuth = false; // TODO: update for actual loading auth

  const onLoginPress = async () => {
    try {
      await handleLogin(email, password);
    } catch (error: any) {
      console.log(error.message)
    }
  };

  return (
    <StyledAuthView>
      <Image source={CactusLogo} style={{height: 120, width: 120}}/>
      <Typography variant='h2' style={{paddingTop: 30, paddingBottom: 30}}>Sign in</Typography>
      <StyledTextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <StyledTextInput
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
