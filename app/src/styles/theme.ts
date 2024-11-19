// src/theme.ts
import { DefaultTheme } from 'react-native-paper';
import { DefaultTheme as StyledDefaultTheme } from 'styled-components/native';

const headingBaseStyle = {
  fontFamily: 'Poppins, sans-serif',
  fontWeight: '300',
  lineHeight: 1.3,
};

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#DDFF00', // cactus neon
    background: '#0D0D0D', // default black on the main page
    success: '#7BEA6D', // green color similar to the one on the chart
    surface: '#161616', // dark color for cards
    text: '#CCCCCC', // light grey
    secondary: '#7D7F78', // darker grey for secondary text
  },
  roundness: 50,
  spacing: 8,
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      ...headingBaseStyle,
      fontSize: 36,
    },
    h2: {
      ...headingBaseStyle,
      fontSize: 30,
    },
    h3: {
      ...headingBaseStyle,
      fontSize: 24,
    },
    h4: {
      ...headingBaseStyle,
      fontSize: 20,
    },
    h5: {
      ...headingBaseStyle,
      fontSize: 16,
    },
    h6: {
      ...headingBaseStyle,
      fontSize: 12,
    },
    body1: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: '300',
      fontSize: 14,
      lineHeight: 1.5,
    },
    body2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
      fontWeight: '300',
      lineHeight: 1.5,
    },
    button: {
      fontFamily: 'Poppins, sans-serif',
      fontSize: 14,
      fontWeight: '400',
      textTransform: 'none', // Ensures button text is not capitalized
    },
  },
  buttonStyles: {
    primary: {
      backgroundColor: '#DDFF00',
      boxShadow: '0px 20px 35px rgba(221, 255, 0, 0.25)',
      color: '#000000',
    },
    secondary: {
      backgroundColor: '#171717',
      color: '#FFFFFF',
      borderColor: '#262626',
    },
  },
};

export default theme;
export const styledTheme = { ...StyledDefaultTheme, ...theme };