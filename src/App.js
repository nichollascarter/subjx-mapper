import React from 'react';
import { Provider } from 'react-redux';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import './App.css';
import store from './store';
import Main from './components/Main';

const outerTheme = createMuiTheme({
    palette: {
        primary: {
            main: '#0c9696',
            auxiliary: '#0a7e95',
            contrastText: '#fff'
        },
        secondary: {
            main: '#43a047'
        },
        error: {
            main: '#f33732',
            hover: '#b71c1c'
        },
        warning: {
            main: '#f57c00',
            hover: '#ffa726'
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.54)'
        },
        disabled: {
            primary: '#1b202a',
            secondary: '#757575'
        }
    },
    typography: {
        fontSize: 14,
        fontWeight: 'normal',
        fontFamily: '-apple-system,system-ui,BlinkMacSystemFont,' +
            '"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
        subtitle1: {
            fontSize: 12,
            fontWeight: 400
        },
        h6: {
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.5
        },
        h5: {
            fontSize: 20,
            fontWeight: 400
        },
        h4: {
            fontSize: 22,
            fontWeight: 400
        },
        overline: {
            color: '#546e7a',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: '13px'
        },
        caption: {
            fontSize: '0.8rem',
            fontWeight: 400
        }
    },
    MuiPaper: {
        rounded: {
            borderRadius: '0.2rem'
        },
        elevation1: {
            boxShadow: '0 1px 5px 0 rgba(0,0,0,0.16), 0 1px 5px 0 rgba(0,0,0,0.12)'
        },
        elevation2: {
            boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)'
        },
        elevation4: {
            boxShadow: '0 5px 10px -5px rgba(0,0,0,0.5)'
        }
    }
});

function App() {
    return (
        <Provider store={store}>
            <ThemeProvider theme={outerTheme}>
                <div className="App">
                    <Main />
                </div>
            </ThemeProvider>
        </Provider>
    );
}

export default App;
