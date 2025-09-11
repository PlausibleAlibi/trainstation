/**
 * Sample component test for Dashboard
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import Dashboard from '../src/Dashboard'

const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('Dashboard Component', () => {
  it('should render without crashing', () => {
    renderWithTheme(<Dashboard />)
    expect(document.body).toBeDefined()
  })

  it('should render some content', () => {
    const { container } = renderWithTheme(<Dashboard />)
    expect(container.firstChild).toBeTruthy()
  })
})