import { Box, Typography } from '@mui/material'
import { spacing } from '../theme'

/**
 * Footer component that displays version information using Vite environment variables.
 * This component automatically picks up version info from import.meta.env which is 
 * populated by the prebuild script that runs stamp_version.sh.
 */
export default function Footer() {
  // Get version info from Vite environment variables with fallbacks
  const version = import.meta.env.VITE_APP_VERSION || 'dev'
  const deployed = import.meta.env.VITE_APP_DEPLOYED || null
  
  // Format deployed date for display
  const formatDate = (dateString: string | null): string | null => {
    if (!dateString) return null
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString // fallback to raw string if parsing fails
    }
  }

  const deployedFormatted = deployed ? formatDate(deployed) : null

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: spacing.sm, 
        px: spacing.md, 
        bgcolor: 'background.default', 
        borderTop: 1, 
        borderColor: 'divider',
        mt: 'auto' // Push footer to bottom when used in flex container
      }}
    >
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Train Station Control Center - Model Railway Management System
        {' | '}
        Version {version}
        {deployedFormatted && ` (deployed ${deployedFormatted})`}
      </Typography>
    </Box>
  )
}