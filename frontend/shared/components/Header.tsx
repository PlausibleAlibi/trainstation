import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material'
import {
  Train as TrainIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material'

interface HeaderProps {
  title: string
  currentMode: 'admin' | 'command-center'
  onModeChange: (mode: 'admin' | 'command-center') => void
}

export default function Header({ title, currentMode, onModeChange }: HeaderProps) {
  return (
    <AppBar position="static">
      <Toolbar>
        <TrainIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<SettingsIcon />}
            variant={currentMode === 'admin' ? 'contained' : 'text'}
            onClick={() => onModeChange('admin')}
            sx={{ 
              bgcolor: currentMode === 'admin' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Admin
          </Button>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            variant={currentMode === 'command-center' ? 'contained' : 'text'}
            onClick={() => onModeChange('command-center')}
            sx={{ 
              bgcolor: currentMode === 'command-center' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Command Center
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}