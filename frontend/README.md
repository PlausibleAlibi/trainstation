# React + TypeScript + Vite + Material UI

This template provides a minimal setup to get React working in Vite with HMR, ESLint rules, and Material UI components.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Material UI Integration

This project uses [Material UI (MUI)](https://mui.com/) as the primary UI component library, providing:

- **Consistent Design System**: Pre-built components following Material Design principles
- **Responsive Layout**: Built-in responsive breakpoints and grid system  
- **Accessible Components**: ARIA-compliant components out of the box
- **Theming**: Customizable theme system with consistent styling
- **TypeScript Support**: Full TypeScript definitions included

### Key MUI Components Used

- **Layout**: `Container`, `Box`, `Paper` for structure and spacing
- **Navigation**: `AppBar`, `Toolbar` for top navigation
- **Forms**: `TextField`, `Select`, `Button`, `Checkbox`, `FormControl` for user inputs
- **Data Display**: `Table`, `Typography`, `Chip`, `Alert` for presenting information
- **Feedback**: `CircularProgress`, `Snackbar` for loading states and notifications
- **Icons**: `@mui/icons-material` for consistent iconography

### Getting Started with MUI

1. **Theme Setup**: The main theme is configured in `src/main.tsx` with:
   ```tsx
   import { ThemeProvider, createTheme } from '@mui/material/styles'
   import CssBaseline from '@mui/material/CssBaseline'
   
   const theme = createTheme({
     palette: {
       primary: { main: '#003366' },
       secondary: { main: '#0066cc' },
     },
   })
   ```

2. **Using Components**: Import components from `@mui/material`:
   ```tsx
   import { Button, TextField, Box } from '@mui/material'
   
   function MyComponent() {
     return (
       <Box sx={{ p: 2 }}>
         <TextField label="Name" />
         <Button variant="contained">Submit</Button>
       </Box>
     )
   }
   ```

3. **Styling with sx prop**: Use the `sx` prop for custom styling:
   ```tsx
   <Box sx={{ 
     display: 'flex', 
     flexDirection: 'column', 
     gap: 2,
     p: { xs: 1, md: 2 } // responsive padding
   }}>
   ```

### MUI Resources

- **Documentation**: https://mui.com/material-ui/getting-started/
- **Component API**: https://mui.com/material-ui/api/
- **Customization Guide**: https://mui.com/material-ui/customization/theming/
- **Icon Library**: https://mui.com/material-ui/material-icons/
- **Templates & Examples**: https://mui.com/material-ui/getting-started/templates/

### Example Components

- `src/App.tsx` - Main application demonstrating MUI form components, tables, and layout
- `src/Dashboard.tsx` - Example dashboard showcasing MUI cards, lists, and statistics display

### Customizing the Theme

To customize colors, typography, or spacing, modify the theme in `src/main.tsx`:

```tsx
const theme = createTheme({
  palette: {
    primary: { main: '#your-color' },
    secondary: { main: '#your-color' },
  },
  typography: {
    fontFamily: 'Your Font, sans-serif',
  },
  spacing: 8, // base spacing unit
})
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
