import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  Train as TrainIcon,
  PowerSettingsNew as PowerIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { spacing, iconSizes, buttonVariants } from '../shared/theme'

// This is a demonstration component showcasing Material UI best practices
// It would typically receive props or use hooks to fetch real data
export default function Dashboard() {
  // Mock data for demonstration
  const stats = {
    totalAccessories: 24,
    activeAccessories: 18,
    totalCategories: 6,
    recentActions: 15,
  }

  const recentActivities = [
    { id: 1, action: 'Signal 1 turned ON', time: '2 minutes ago', type: 'success' },
    { id: 2, action: 'Turnout 3 switched', time: '5 minutes ago', type: 'info' },
    { id: 3, action: 'Light 7 turned OFF', time: '8 minutes ago', type: 'warning' },
  ]

  const categories = [
    { name: 'Signals', count: 8, active: 6 },
    { name: 'Turnouts', count: 6, active: 5 },
    { name: 'Lights', count: 10, active: 7 },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: spacing.xl }}>
      <Box sx={{ mb: spacing.xl }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <TrainIcon sx={{ fontSize: iconSizes.xlarge }} />
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your Train Station control panel. Monitor and manage your model railway accessories.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gap: spacing.lg, 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
        mb: spacing.xl 
      }}>
        <Card>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Total Accessories
                </Typography>
                <Typography variant="h4">
                  {stats.totalAccessories}
                </Typography>
              </Box>
              <SettingsIcon sx={{ fontSize: iconSizes.xlarge, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Active Now
                </Typography>
                <Typography variant="h4">
                  {stats.activeAccessories}
                </Typography>
              </Box>
              <PowerIcon sx={{ fontSize: iconSizes.xlarge, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Categories
                </Typography>
                <Typography variant="h4">
                  {stats.totalCategories}
                </Typography>
              </Box>
              <SpeedIcon sx={{ fontSize: iconSizes.xlarge, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Recent Actions
                </Typography>
                <Typography variant="h4">
                  {stats.recentActions}
                </Typography>
              </Box>
              <ScheduleIcon sx={{ fontSize: iconSizes.xlarge, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gap: spacing.lg, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        {/* Categories Overview */}
        <Card>
          <CardContent sx={{ p: spacing.lg }}>
            <Typography variant="h5" gutterBottom>
              Categories Overview
            </Typography>
            <List sx={{ p: 0 }}>
              {categories.map((category, index) => (
                <React.Fragment key={category.name}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <TrainIcon sx={{ fontSize: iconSizes.medium }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={category.name}
                      secondary={`${category.count} total accessories`}
                    />
                    <Chip 
                      label={`${category.active} active`}
                      color={category.active > 0 ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                  {index < categories.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: spacing.md }}>
              <Button {...buttonVariants.outline} fullWidth>
                View All Categories
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent sx={{ p: spacing.lg }}>
            <Typography variant="h5" gutterBottom>
              Recent Activity
            </Typography>
            <List sx={{ p: 0 }}>
              {recentActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={activity.action}
                      secondary={activity.time}
                    />
                    <Chip 
                      label={activity.type}
                      color={activity.type as 'success' | 'info' | 'warning'}
                      size="small"
                    />
                  </ListItem>
                  {index < recentActivities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: spacing.md }}>
              <Button {...buttonVariants.outline} fullWidth>
                View All Activities
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mt: spacing.xl }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          <Button {...buttonVariants.primary} startIcon={<PowerIcon sx={{ fontSize: iconSizes.small }} />}>
            Turn All On
          </Button>
          <Button {...buttonVariants.secondary} startIcon={<PowerIcon sx={{ fontSize: iconSizes.small }} />}>
            Turn All Off
          </Button>
          <Button {...buttonVariants.outline} startIcon={<SettingsIcon sx={{ fontSize: iconSizes.small }} />}>
            System Settings
          </Button>
          <Button {...buttonVariants.outline} startIcon={<TrainIcon sx={{ fontSize: iconSizes.small }} />}>
            Add New Accessory
          </Button>
        </Box>
      </Box>
    </Container>
  )
}