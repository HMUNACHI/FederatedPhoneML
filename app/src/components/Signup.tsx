import React, { useEffect, useState } from 'react';
import { handleSignup } from './Outh';
import Typography from './primary/Typography';
import { Image, View, TouchableOpacity, Platform } from 'react-native';
import CactusLogo from "../assets/images/logo_light_grey.png"
import StyledTextInput from './primary/TextField';
import CustomButton from './primary/Button';

import theme from '../styles/theme';
import styled from 'styled-components/native';

const SignupScreen = ({ setLoginInProgress, switchToLogin }) => {
  const [ email, setEmail ] = useState('');
  const [ errorMessage, setErrorMessage ] = useState('')
  const [ password, setPassword ] = useState('');
  const [ passwordConfirmation, setPasswordConfirmation ] = useState('');
  const [ buttonLoading, setButtonLoading ] = useState(false);

  const loadingAuth = false; // TODO: update for actual loading auth

  const onSignupPress = async () => {
    setButtonLoading(true)
    if (password !== passwordConfirmation){setErrorMessage('Passwords must match')}
    try {
      const error = await handleSignup(email, password)
      if (error){
        setErrorMessage(error)
      }else{
        setLoginInProgress(false)
      }
    } catch (error: any) {
      console.log(error.message)
    }
    setButtonLoading(false)
  };

  useEffect(() => {
    setLoginInProgress(true)
  }, [])

  return (
    <StyledAuthView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Image source={CactusLogo} style={{height: 120, width: 120}}/>
      <Typography variant='h2' style={{paddingTop: 30, paddingBottom: 10}}>Sign up</Typography>
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
      <StyledTextInput
        secureTextEntry={true}
        placeholder="Confirm Password"
        value={passwordConfirmation}
        onChangeText={(value:string) => {setPasswordConfirmation(value); setErrorMessage('')}}
      />
      {errorMessage ? 
        <Typography variant='body2' style={{color: theme.colors.primary, marginBottom: 15}}>{errorMessage}</Typography> 
      : null}
      <CustomButton customVariant='primary' onPress={onSignupPress} loading={loadingAuth || buttonLoading}>Sign up</CustomButton>
      <View style={{flex: 1}}/>
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant='body2'>Already have an account? </Typography>
        <TouchableOpacity onPress={switchToLogin}>
          <Typography variant='body2' style={{color: theme.colors.primary, fontWeight: 400 }}>
            Click here to log in
          </Typography>
        </TouchableOpacity>
      </View>
    </StyledAuthView>
  );
};

const StyledAuthView = styled.KeyboardAvoidingView`
  flex: 1;
  justify-content: top;
  align-items: center;
  padding: 40px 30px; /* Top and Bottom 40px; Left and Right = 20px */
  background-color: ${theme.colors.background};
`;

export default SignupScreen;