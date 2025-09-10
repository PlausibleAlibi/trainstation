import {
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material'
import {
  Construction as ConstructionIcon,
} from '@mui/icons-material'

export default function TrackLayout() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Virtual Track Layout
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Interactive track layout for direct control of switches, sections, and trains.
      </Typography>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ConstructionIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          Track Layout Visualization
        </Typography>
        
        <Alert severity="info" sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body1">
            <strong>Coming Soon!</strong><br />
            This section will display an interactive track layout where you can:
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', mt: 2, mb: 0 }}>
            <li>View real-time track section status</li>
            <li>Click switches to change their position</li>
            <li>See train locations and movements</li>
            <li>Monitor section occupancy</li>
            <li>Control signals and accessories</li>
          </Box>
        </Alert>
      </Paper>
    </Box>
  )
}