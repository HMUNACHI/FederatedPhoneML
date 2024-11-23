import React, { useState } from 'react';
import styled from 'styled-components/native';
import theme from '../../styles/theme';

// Styled Container
const StyledContainer = styled.View`
  width: 100%;
  height: auto;
  margin: ${theme.spacing * 2}px 0;
`;

// Styled Input
const StyledInput = styled.TextInput<{ isFocused: boolean }>`
  width: 100%;
  border-color: ${({ isFocused }) =>
    isFocused ? theme.colors.primary : theme.colors.textDefault};
  border-width: ${({ isFocused }) => (isFocused ? '1px' : '0.5px')};
  border-radius: ${theme.roundness}px;
  padding: 25px;
  color: ${theme.colors.textDefault};
  background-color: ${theme.colors.surface};
  text-transform: none;
`;

const StyledTextInput = ({ value, onChangeText, placeholder='placeholder', secureTextEntry=false }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <StyledContainer>
      <StyledInput
        secureTextEntry={secureTextEntry}
        isFocused={isFocused}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
      />
    </StyledContainer>
  );
};

export default StyledTextInput;