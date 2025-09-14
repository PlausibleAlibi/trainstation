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
import Footer from './components/Footer';

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
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center', 
            justifyContent: 'space-around', 
            minHeight: '60vh',
            gap: 4,
            py: 4,
            px: 2,
            flexWrap: 'wrap'
          }}>
            {/* Image Container - Left side */}
            <Box sx={{
              flex: '0 0 400px',
              maxWidth: 400,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
              padding: 2
            }}>
              <img 
                src={trainCollisionImage} 
                alt="Train Collision"
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            </Box>
            
            {/* Text Container - Right side */}
            <Box sx={{
              flex: '1 1 400px',
              textAlign: 'left',
              maxWidth: 600,
              minWidth: 300
            }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                fontSize: '3rem'
              }}>
                Welcome to TrainStation!
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{
                lineHeight: 1.6,
                fontStyle: 'italic',
                fontSize: '1.25rem'
              }}>
                Your all-in-one solution for managing model railway accessories, track lines, sections, switches, and connections.
              </Typography>
            </Box>
          </Box>
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
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 3,
            py: 4,
            maxWidth: 800,
            margin: '0 auto'
          }}>
            <Typography variant="h4" component="h1" gutterBottom>
              About TrainStation
            </Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
              Release notes and instructions will appear here soon.
            </Typography>
            <Box sx={{ 
              mt: 4, 
              p: 3, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              borderLeft: 4,
              borderColor: 'primary.main'
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                <strong>Fun Fact:</strong> Did you know? The longest train ever recorded was over 7.3 km long!
              </Typography>
            </Box>
          </Box>
        </TabPanel>
      </Container>

      <Footer />
    </Box>
  );
}