import { createTheme } from '@mui/material/styles'

// Shared theme for both admin and command center apps
export const theme = createTheme({
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