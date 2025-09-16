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
  Home as HomeIcon,
  Info as InfoIcon,
  Train as TrainIcon,
  LinearScale as SectionIcon,
  CallSplit as SwitchIcon,
  Hub as ConnectionIcon,
  Settings as AccessoryIcon,
} from '@mui/icons-material';

// Import the train collision image
import trainCollisionImage from './assets/traincrash.jpg';

// Import all the managers
import TrackLinesManager from './TrackLinesManager';
import SectionsManager from './SectionsManager';
import SwitchesManager from './SwitchesManager';
import SectionConnectionsManager from './SectionConnectionsManager';
import App from './App'; // Original accessories/categories manager
import Footer from '../shared/components/Footer';
import HomepagePanel from './components/HomepagePanel';
import AboutPanel from './components/AboutPanel';

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

  // About info configuration
  const aboutInfo = {
    title: "About TrainStation",
    description: "Release notes and instructions will appear here soon.",
    funFact: "Did you know? The longest train ever recorded was over 7.3 km long!"
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <TrainIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Train Station Control Center
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
              icon={<HomeIcon />} 
              label="Home" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
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
            <Tab 
              icon={<InfoIcon />} 
              label="About" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>
      </AppBar>

      <Container maxWidth="xl" sx={{ flex: 1, py: 0 }}>
        <TabPanel value={currentTab} index={0}>
          <HomepagePanel 
            imageUrl={trainCollisionImage} 
            imageAlt="Train Collision"
          />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <App />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <TrackLinesManager />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <SectionsManager />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <SwitchesManager />
        </TabPanel>
        <TabPanel value={currentTab} index={5}>
          <SectionConnectionsManager />
        </TabPanel>
        <TabPanel value={currentTab} index={6}>
          <AboutPanel aboutInfo={aboutInfo} />
        </TabPanel>
      </Container>

      <Footer />
    </Box>
  );
}