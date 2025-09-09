import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App'

// Create a basic MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#003366', // Train station blue
    },
    secondary: {
      main: '#0066cc',
    },
  },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)