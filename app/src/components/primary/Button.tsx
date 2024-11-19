import React from 'react';
import Typography from './Typography';
import theme from '../../styles/theme';
import { ActivityIndicator } from 'react-native';
import { Pressable, PressableProps } from 'react-native'; // Pressable is a lower-level button component and supports more customization

interface CustomButtonProps extends PressableProps {
  customVariant?: 'primary' | 'secondary'; // Custom variant for styling
  loading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({ children, customVariant='primary', loading=false, ...props }) => {

  const buttonColor = customVariant === 'primary' ? theme.colors.primary : theme.colors.surface
  const fontColor = customVariant === 'primary' ? theme.colors.background : theme.colors.textDefault

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
            paddingLeft: 40,
            paddingRight: 40,
            paddingTop: 20,
            paddingBottom: 20,
            borderRadius: 50,
            borderWidth: customVariant === 'primary' ? 0 : 1,
            borderColor: customVariant === 'primary' ? null : theme.colors.textSecondary,
            alignItems: 'center',
          },
          pressed && buttonShadow,
        ]}
    >
      { loading ? <ActivityIndicator color={theme.colors.background}/> : <Typography variant="h6" style={{color: fontColor}}>{children}</Typography> }
    </Pressable>
  );
};

export default CustomButton;