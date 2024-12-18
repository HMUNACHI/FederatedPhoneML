import React from 'react'
import { Platform } from 'react-native'
import SocialAuthButton from '../primary/SocialAuthButton'
import * as AppleAuthentication from 'expo-apple-authentication'
import { registerOrRetrieveDeviceFromSupabase, supabase } from 'src/communications/Supabase'

export const PlatformAuth: React.FC = () => {
  if (Platform.OS === 'ios') {
    return (
      <SocialAuthButton
        customVariant='secondary'
        provider='apple'
        style={{ width: 200, height: 64 }}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            })
            // Sign in via Supabase Auth.
            if (credential.identityToken) {
              const {
                error,
                data: { user },
              } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
              })
              // if (!error) {}
              if (error){console.log(JSON.stringify({ error, user }, null, 2))}
            } else {
              throw new Error('No identityToken.')
            }
          } catch (e) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
              // handle that the user canceled the sign-in flow
            } else {
              // handle other errors
            }
          }
        }}
      />
    )
  }else{
    return null //add android? maybe
  }
}

{/* <AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={5}
  style={{ width: 200, height: 64 }}
  onPress={async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      // Sign in via Supabase Auth.
      if (credential.identityToken) {
        const {
          error,
          data: { user },
        } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })
        console.log(JSON.stringify({ error, user }, null, 2))
        if (!error) {
          // User is signed in.
        }
      } else {
        throw new Error('No identityToken.')
      }
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  }}
/> */}