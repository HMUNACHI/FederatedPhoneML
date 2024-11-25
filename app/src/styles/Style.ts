import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import theme from './theme';

export const HomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    color: '#333',
  },
});

export const AuthStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});


export const MainContent = styled.View`
  flex: 1;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-top: 0px;
  background: ${theme.colors.background};
`;