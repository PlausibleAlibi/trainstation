/**
 * Sample React component test using Vitest and React Testing Library
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme } from '@mui/material/styles'
import App from '../src/App'

// Create a basic theme for testing
const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {component}
    </ThemeProvider>
  )
}

describe('App Component', () => {
  it('should render without crashing', () => {
    renderWithTheme(<App />)
    // If we get here without throwing, the component rendered successfully
    expect(document.body).toBeDefined()
  })

  it('should render some content', () => {
    const { container } = renderWithTheme(<App />)
    // Check that some content was rendered
    expect(container.firstChild).toBeTruthy()
  })
})