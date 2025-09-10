import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '../shared/theme'
import AdminApp from './AdminApp'
import Header from '../shared/components/Header'
import Footer from '../shared/components/Footer'
import { Box, Container } from '@mui/material'
import CommandCenterMain from './CommandCenterMain'

export default function AppRouter() {
  const [currentMode, setCurrentMode] = React.useState<'admin' | 'command-center'>(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('mode') === 'command-center' ? 'command-center' : 'admin'
  })

  const handleModeChange = (mode: 'admin' | 'command-center') => {
    setCurrentMode(mode)
    const url = new URL(window.location.href)
    url.searchParams.set('mode', mode)
    window.history.pushState({}, '', url.toString())
  }

  const getTitle = () => {
    return currentMode === 'admin' 
      ? 'Train Station Control Center' 
      : 'Train Station Command Center'
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header 
          title={getTitle()}
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />
        
        <Container maxWidth="xl" sx={{ flex: 1, py: currentMode === 'admin' ? 0 : 3 }}>
          {currentMode === 'admin' ? (
            <AdminApp />
          ) : (
            <CommandCenterMain />
          )}
        </Container>

        <Footer />
      </Box>
    </ThemeProvider>
  )
}