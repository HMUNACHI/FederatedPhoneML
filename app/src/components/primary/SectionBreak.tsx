// src/components/SectionBreak.tsx
import React from 'react';
import theme from '../../styles/theme';
import Typography from './Typography';
import styled from 'styled-components/native';

interface SectionBreakProps {
  children: React.ReactNode; // Children (basically plain text) to be displayed as the label
}

const DividerContainer = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
`;

const HorizontalLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${theme.colors.primary};
  opacity: 0.3;
`;

const SectionBreakContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 10px; /* Add margin around the text block */
`;

const SectionBreak: React.FC<SectionBreakProps> = ({ children }) => {
  return (
    <DividerContainer>
      <SectionBreakContainer>
        <HorizontalLine />
        <Typography variant="h6" style={{color: theme.colors.primary, paddingLeft: 10, paddingRight: 10}}>
          {children}
        </Typography>
        <HorizontalLine />
      </SectionBreakContainer>
    </DividerContainer>
  );
};

export default SectionBreak;