import React from "react";
import { Text } from "react-native";

import theme from '../../styles/theme';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2';

interface TypographyProps {
    variant: TypographyVariant; // h1, h2, body1, etc
    style?: object; // lets us pass in typography customizations if needed
    children: React.ReactNode; 
}

const Typography: React.FC<TypographyProps> = ({ variant='body1', style, children }) => {
    const textStyles = [
        {...theme.typography[variant], color: theme.colors.textDefault}, 
        style
    ];
    return <Text style={textStyles}>{children}</Text>;
};

export default Typography