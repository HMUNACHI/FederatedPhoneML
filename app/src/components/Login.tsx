import React, { useEffect, useState } from 'react';
import { handleLogin } from './Outh';
import SectionBreak from './primary/SectionBreak';
import Typography from './primary/Typography';
import { Image, View } from 'react-native';
import CactusLogo from "../assets/images/logo_light_grey.png"
import StyledTextInput from './primary/TextField';
import CustomButton from './primary/Button';
import { PlatformAuth } from './auth/PlatformAuth.native';

import theme from '../styles/theme';
import styled from 'styled-components/native';

const LoginScreen = ({ setLoginInProgress }) => {
  const [email, setEmail] = useState('');
  const [ errorMessage, setErrorMessage ] = useState('')
  const [password, setPassword] = useState('');

  const loadingAuth = false; // TODO: update for actual loading auth

  const onLoginPress = async () => {
    try {
      const error = await handleLogin(email, password)
      if (error){
        setErrorMessage(error)
      }else{
        setLoginInProgress(false)
      }
    } catch (error: any) {
      console.log(error.message)
    }
  };

  useEffect(() => {
    setLoginInProgress(true)
  }, [])

  return (
    <StyledAuthView>
      <Image source={CactusLogo} style={{height: 120, width: 120}}/>
      <Typography variant='h2' style={{paddingTop: 30, paddingBottom: 30}}>Sign in</Typography>
      <StyledTextInput
        placeholder="Email"
        value={email}
        onChangeText={(value:string) => {setEmail(value); setErrorMessage('')}}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <StyledTextInput
        secureTextEntry={true}
        placeholder="Password"
        value={password}
        onChangeText={(value:string) => {setPassword(value); setErrorMessage('')}}
      />
      {errorMessage ? 
        <Typography variant='body2' style={{color: theme.colors.primary, marginBottom: 15}}>{errorMessage}</Typography> 
      : null}
      <CustomButton customVariant='primary' onPress={onLoginPress} loading={loadingAuth}>Sign in</CustomButton>
      <SectionBreak>or use</SectionBreak>
      <View style={{flexDirection: 'row', gap: 10}}>
        <PlatformAuth/>
      </View>
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
