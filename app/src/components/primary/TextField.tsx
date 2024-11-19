import React, { useState } from 'react';
import styled from 'styled-components/native';
import theme from '../../styles/theme';

// Styled Container
const StyledContainer = styled.View`
  width: 100%;
  margin: ${theme.spacing * 2}px 0;
`;

// Styled Input
const StyledInput = styled.TextInput<{ isFocused: boolean }>`
  width: 100%;
  border-color: ${({ isFocused }) =>
    isFocused ? theme.colors.primary : theme.colors.text};
  border-width: ${({ isFocused }) => (isFocused ? '1px' : '0.5px')};
  border-radius: ${theme.roundness}px;
  padding: 10px;
  color: ${theme.colors.text};
  background-color: ${theme.colors.surface};
`;

const StyledTextField = ({ value, onChangeText, placeholder }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <StyledContainer>
      <StyledInput
        isFocused={isFocused}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </StyledContainer>
  );
};

export default StyledTextField;