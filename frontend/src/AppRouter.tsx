import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '../shared/theme'
import AdminApp from './AdminApp'
import Header from '../shared/components/Header'
import Footer from '../shared/components/Footer'
import { Box, Container } from '@mui/material'
import CommandCenterMain from './CommandCenterMain'
import LabMain from './LabMain'

export default function AppRouter() {
  const [currentMode, setCurrentMode] = React.useState<'admin' | 'command-center' | 'lab'>(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    if (mode === 'command-center') return 'command-center'
    if (mode === 'lab') return 'lab'
    return 'admin'
  })

  const handleModeChange = (mode: 'admin' | 'command-center' | 'lab') => {
    setCurrentMode(mode)
    const url = new URL(window.location.href)
    url.searchParams.set('mode', mode)
    window.history.pushState({}, '', url.toString())
  }

  const getTitle = () => {
    switch (currentMode) {
      case 'admin':
        return 'Train Station Control Center'
      case 'command-center':
        return 'Train Station Command Center'
      case 'lab':
        return 'Train Station Lab'
      default:
        return 'Train Station Control Center'
    }
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
          ) : currentMode === 'command-center' ? (
            <CommandCenterMain />
          ) : (
            <LabMain />
          )}
        </Container>

        <Footer />
      </Box>
    </ThemeProvider>
  )
}