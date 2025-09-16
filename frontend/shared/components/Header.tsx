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
  Science as LabIcon,
} from '@mui/icons-material'
import { spacing, iconSizes } from '../theme'

interface HeaderProps {
  title: string
  currentMode: 'admin' | 'command-center' | 'lab'
  onModeChange: (mode: 'admin' | 'command-center' | 'lab') => void
}

export default function Header({ title, currentMode, onModeChange }: HeaderProps) {
  return (
    <AppBar position="static">
      <Toolbar>
        <TrainIcon sx={{ mr: spacing.md, fontSize: iconSizes.medium }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: spacing.sm }}>
          <Button
            color="inherit"
            startIcon={<SettingsIcon sx={{ fontSize: iconSizes.small }} />}
            variant={currentMode === 'admin' ? 'contained' : 'text'}
            onClick={() => onModeChange('admin')}
            sx={{ 
              bgcolor: currentMode === 'admin' ? 'primary.dark' : 'transparent',
              '&:hover': {
                bgcolor: currentMode === 'admin' ? 'primary.dark' : 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            Admin
          </Button>
          <Button
            color="inherit"
            startIcon={<DashboardIcon sx={{ fontSize: iconSizes.small }} />}
            variant={currentMode === 'command-center' ? 'contained' : 'text'}
            onClick={() => onModeChange('command-center')}
            sx={{ 
              bgcolor: currentMode === 'command-center' ? 'primary.dark' : 'transparent',
              '&:hover': {
                bgcolor: currentMode === 'command-center' ? 'primary.dark' : 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            Command Center
          </Button>
          <Button
            color="inherit"
            startIcon={<LabIcon sx={{ fontSize: iconSizes.small }} />}
            variant={currentMode === 'lab' ? 'contained' : 'text'}
            onClick={() => onModeChange('lab')}
            sx={{ 
              bgcolor: currentMode === 'lab' ? 'primary.dark' : 'transparent',
              '&:hover': {
                bgcolor: currentMode === 'lab' ? 'primary.dark' : 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            Lab
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}