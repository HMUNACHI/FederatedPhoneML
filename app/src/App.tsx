import React from 'react';
import { SafeAreaView } from 'react-native';
import { styledTheme } from './styles/theme';
import { ThemeProvider } from 'styled-components/native';
import Home from './components/Home';
import theme from './styles/theme';

import {isAvailable, train, evaluate, predict} from './ferra';

const App = () => {
    return (
        <SafeAreaView  style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ThemeProvider theme={styledTheme}>
            <Home/>
        </ThemeProvider>
        </SafeAreaView>
    );
};

export default App;