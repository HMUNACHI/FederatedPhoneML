import React from 'react';
import { AntDesign } from '@expo/vector-icons';
import theme from '../../styles/theme';
import { ActivityIndicator } from 'react-native';
import { Pressable, PressableProps } from 'react-native'; // Pressable is a lower-level button component and supports more customization

interface SocialAuthButtonProps extends PressableProps {
  customVariant?: 'primary' | 'secondary'; // Custom variant for styling
  provider: 'apple' | 'google' | 'android' | 'facebook';
  loading?: boolean;
}
const getIconName = (provider: string) => {
  switch (provider) {
    case 'apple':
      return 'apple1';
    case 'android':
      return 'android1';
    case 'google':
      return 'google';
    case 'facebook':
      return 'facebook-square';
    default:
      return 'questioncircle';
  }
};

const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({ provider, customVariant='primary', loading=false, ...props }) => {

  const buttonColor = customVariant === 'primary' ? theme.colors.primary : theme.colors.surface
  const iconColor = customVariant === 'primary' ? theme.colors.background : theme.colors.textDefault
  const iconName = getIconName(provider)

  const buttonShadow = customVariant === 'primary'
    ? { shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 5,  }
    : {};

  return (
    <Pressable 
        onPress={props.onPress}
        disabled={loading}
        style={({pressed}) => [
          {
            backgroundColor: buttonColor,
            padding: 20,
            borderRadius: 50,
            borderWidth: customVariant === 'primary' ? 0 : 1,
            borderColor: customVariant === 'primary' ? null : theme.colors.textSecondary,
            alignItems: 'center',
          },
          pressed && buttonShadow,
        ]}
    >
      { loading ? (
        <ActivityIndicator color={theme.colors.background}/>
      ) : (
        <AntDesign name={iconName} size={24} color={iconColor} style={{ }} />
      )}
    </Pressable>
  );
};

export default SocialAuthButton;