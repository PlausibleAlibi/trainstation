import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Home as HomeIcon,
  Info as InfoIcon,
  Train as TrainIcon,
  LinearScale as SectionIcon,
  CallSplit as SwitchIcon,
  Hub as ConnectionIcon,
  Settings as AccessoryIcon,
  Build as MaintenanceIcon,
} from '@mui/icons-material';

// Import the train crash image
import trainCrashImage from './assets/traincrash.jpg';

// Import all the managers
import TrackLinesManager from './TrackLinesManager';
import SectionsManager from './SectionsManager';
import SwitchesManager from './SwitchesManager';
import SectionConnectionsManager from './SectionConnectionsManager';
import MaintenanceManager from './MaintenanceManager';
import App from './App'; // Original accessories/categories manager
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

export default function AdminApp() {
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
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<HomeIcon />} 
            label="Home" 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<MaintenanceIcon />} 
            label="Rail Yard" 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<AccessoryIcon />} 
            label="Parts Depot" 
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
        <TabPanel value={currentTab} index={0}>
          <HomepagePanel 
            imageUrl={trainCrashImage} 
            imageAlt="Train Crash"
          />
        </TabPanel>
         <TabPanel value={currentTab} index={1}>
          <MaintenanceManager />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <App />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <TrackLinesManager />
        </TabPanel>
        <TabPanel value={currentTab} index={4}>
          <SectionsManager />
        </TabPanel>
        <TabPanel value={currentTab} index={5}>
          <SwitchesManager />
        </TabPanel>
        <TabPanel value={currentTab} index={6}>
          <SectionConnectionsManager />
        </TabPanel>
       
        <TabPanel value={currentTab} index={7}>
          <AboutPanel aboutInfo={aboutInfo} />
        </TabPanel>
      </Box>
    );
  }