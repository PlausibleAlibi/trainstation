import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
} from '@mui/material'
import {
  PowerSettingsNew as PowerIcon,
  Train as TrainIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material'
import { spacing, iconSizes, buttonVariants } from '../shared/theme'

export default function CommandCenterDashboard() {
  // Placeholder data - in the future this would come from the backend
  const systemStatus = {
    powerOn: false,
    activeTrains: 0,
    warnings: 0,
    connectedSections: 12,
  }

  const handlePowerToggle = () => {
    // TODO: Implement power control logic
    console.log('Power toggle clicked - functionality to be implemented')
  }

  const handleEmergencyStop = () => {
    // TODO: Implement emergency stop logic
    console.log('Emergency stop clicked - functionality to be implemented')
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Control Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: spacing.xl }}>
        Monitor and control your model railway system from this central dashboard.
      </Typography>

      {/* Status Overview */}
      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.lg,
        mb: spacing.xl 
      }}>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  System Power
                </Typography>
                <Chip 
                  label={systemStatus.powerOn ? 'ON' : 'OFF'}
                  color={systemStatus.powerOn ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <PowerIcon sx={{ 
                fontSize: iconSizes.xlarge, 
                color: systemStatus.powerOn ? 'success.main' : 'text.disabled' 
              }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Active Trains
                </Typography>
                <Typography variant="h4">
                  {systemStatus.activeTrains}
                </Typography>
              </Box>
              <TrainIcon sx={{ fontSize: iconSizes.xlarge, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Warnings
                </Typography>
                <Typography variant="h4">
                  {systemStatus.warnings}
                </Typography>
              </Box>
              <WarningIcon sx={{ 
                fontSize: iconSizes.xlarge, 
                color: systemStatus.warnings > 0 ? 'warning.main' : 'text.disabled' 
              }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Connected Sections
                </Typography>
                <Typography variant="h4">
                  {systemStatus.connectedSections}
                </Typography>
              </Box>
              <SpeedIcon sx={{ fontSize: iconSizes.xlarge, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Control Panel */}
      <Paper sx={{ p: spacing.lg, mb: spacing.lg }}>
        <Typography variant="h5" component="h2" gutterBottom>
          System Controls
        </Typography>
        
        <Box sx={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          <Button
            {...(systemStatus.powerOn ? buttonVariants.error : buttonVariants.success)}
            startIcon={<PowerIcon sx={{ fontSize: iconSizes.small }} />}
            onClick={handlePowerToggle}
            size="large"
          >
            {systemStatus.powerOn ? 'Turn Off Power' : 'Turn On Power'}
          </Button>
          
          <Button
            {...buttonVariants.error}
            onClick={handleEmergencyStop}
            size="large"
          >
            Emergency Stop
          </Button>
        </Box>
      </Paper>

      {/* Placeholder for future features */}
      <Paper sx={{ p: spacing.lg }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Coming Soon
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          • Individual track section controls<br />
          • Switch position controls<br />
          • Train speed and direction controls<br />
          • Real-time system monitoring<br />
          • Historical event logs
        </Typography>
      </Paper>
    </Box>
  )
}