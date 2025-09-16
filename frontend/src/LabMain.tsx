import React, { useState } from 'react'
import {
  Box,
  Tabs,
  Tab,
  Button,
  Typography,
  Paper,
} from '@mui/material'
import {
  BugReport as AccessoryTesterIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { spacing, buttonVariants } from '../shared/theme'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lab-tabpanel-${index}`}
      aria-labelledby={`lab-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export default function LabMain() {
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<AccessoryTesterIcon />} 
            label="Accessory Tester" 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Paper sx={{ p: spacing.lg, textAlign: 'center' }}>
          <AccessoryTesterIcon sx={{ fontSize: 64, color: 'primary.main', mb: spacing.md }} />
          
          <Typography variant="h4" component="h2" gutterBottom>
            Accessory Tester
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: spacing.lg, maxWidth: 600, mx: 'auto' }}>
            Test end-to-end communication between the FastAPI backend, ESP32 nodes, and accessory relays.
            This interface demonstrates the mapping defined in accessory_map.yaml.
          </Typography>

          <Button
            {...buttonVariants.primary}
            size="large"
            startIcon={<OpenInNewIcon />}
            onClick={() => window.open('/labtest/accessory_tester.html', '_blank')}
            sx={{ mb: spacing.md }}
          >
            Open Accessory Tester
          </Button>

          <Typography variant="body2" color="text.secondary">
            The Accessory Tester will open in a new tab.
          </Typography>
        </Paper>
      </TabPanel>
    </Box>
  )
}