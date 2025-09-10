import React, { useState } from 'react'
import {
  Box,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  AccountTree as TrackLayoutIcon,
} from '@mui/icons-material'
import CommandCenterDashboard from './CommandCenterDashboard'
import CommandCenterTrackLayout from './CommandCenterTrackLayout'

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
      id={`command-center-tabpanel-${index}`}
      aria-labelledby={`command-center-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export default function CommandCenterMain() {
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
            icon={<DashboardIcon />} 
            label="Control Dashboard" 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<TrackLayoutIcon />} 
            label="Track Layout" 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <CommandCenterDashboard />
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <CommandCenterTrackLayout />
      </TabPanel>
    </Box>
  )
}