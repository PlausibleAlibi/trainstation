import { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container,
} from '@mui/material';
import {
  Train as TrainIcon,
  LinearScale as SectionIcon,
  CallSplit as SwitchIcon,
  Hub as ConnectionIcon,
  Settings as AccessoryIcon,
} from '@mui/icons-material';

// Import all the managers
import TrackLinesManager from './TrackLinesManager';
import SectionsManager from './SectionsManager';
import SwitchesManager from './SwitchesManager';
import SectionConnectionsManager from './SectionConnectionsManager';
import App from './App'; // Original accessories/categories manager

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function TrainStationApp() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const version = import.meta.env.VITE_VERSION || 'dev';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <TrainIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Train Station Control Center
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            v{version}
          </Typography>
        </Toolbar>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '& .MuiTab-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'white'
              }
            }}
          >
            <Tab 
              icon={<AccessoryIcon />} 
              label="Accessories & Categories" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<TrainIcon />} 
              label="Track Lines" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<SectionIcon />} 
              label="Sections" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<SwitchIcon />} 
              label="Switches" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<ConnectionIcon />} 
              label="Connections" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>
      </AppBar>

      <Container maxWidth="xl" sx={{ flex: 1, py: 0 }}>
        <TabPanel value={currentTab} index={0}>
          <App />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <TrackLinesManager />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <SectionsManager />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <SwitchesManager />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <SectionConnectionsManager />
        </TabPanel>
      </Container>

      <Box component="footer" sx={{ py: 1, px: 2, bgcolor: 'grey.100', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Train Station Control Center - Model Railway Management System
        </Typography>
      </Box>
    </Box>
  );
}