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
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  spacing: 8, // 8px base unit
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Preserve natural casing
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderRadius: 12,
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
})

// Theme utility functions for consistent usage
export const spacing = {
  xs: theme.spacing(0.5), // 4px
  sm: theme.spacing(1),   // 8px
  md: theme.spacing(2),   // 16px
  lg: theme.spacing(3),   // 24px
  xl: theme.spacing(4),   // 32px
  xxl: theme.spacing(6),  // 48px
} as const

export const iconSizes = {
  small: 20,
  medium: 24,
  large: 32,
  xlarge: 40,
} as const

// Standard button variants for consistent usage
export const buttonVariants = {
  primary: { variant: 'contained' as const, color: 'primary' as const },
  secondary: { variant: 'contained' as const, color: 'secondary' as const },
  success: { variant: 'contained' as const, color: 'success' as const },
  warning: { variant: 'contained' as const, color: 'warning' as const },
  error: { variant: 'contained' as const, color: 'error' as const },
  outline: { variant: 'outlined' as const },
  text: { variant: 'text' as const },
} as const