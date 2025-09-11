/**
 * Sample component test for Dashboard
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  it('should render the dashboard title', () => {
    renderWithTheme(<Dashboard />)
    
    // Look for dashboard-related text
    const dashboardElements = screen.getAllByText(/dashboard/i)
    expect(dashboardElements.length).toBeGreaterThan(0)
  })

  it('should render management cards', () => {
    renderWithTheme(<Dashboard />)
    
    // Check that some cards are rendered
    const cards = document.querySelectorAll('[role="button"], .MuiCard-root')
    expect(cards.length).toBeGreaterThan(0)
  })
})