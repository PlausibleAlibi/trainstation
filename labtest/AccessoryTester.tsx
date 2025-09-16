import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import TimerIcon from '@mui/icons-material/Timer';

interface Accessory {
  name: string;
  esp32_node: string;
  control_type: string;
  description: string;
}

interface ESP32Node {
  node_id: string;
  ip: string;
  port: number;
  description: string;
  location: string;
}

interface TestResult {
  status: string;
  accessory_name: string;
  action: string;
  esp32_node: string;
  hardware_address: string;
  pin: number;
  control_type: string;
  milliseconds?: number;
  simulated_result: string;
  message: string;
}

const AccessoryTester: React.FC = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [esp32Nodes, setEsp32Nodes] = useState<ESP32Node[]>([]);
  const [selectedAccessory, setSelectedAccessory] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<number>(5000);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string>('');

  // Load accessories and ESP32 nodes on component mount
  useEffect(() => {
    loadAccessories();
    loadEsp32Nodes();
  }, []);

  const loadAccessories = async () => {
    try {
      const response = await fetch('/test/accessories');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAccessories(data.accessories || []);
    } catch (err) {
      setError(`Failed to load accessories: ${err}`);
    }
  };

  const loadEsp32Nodes = async () => {
    try {
      const response = await fetch('/test/esp32-nodes');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setEsp32Nodes(data.nodes || []);
    } catch (err) {
      setError(`Failed to load ESP32 nodes: ${err}`);
    }
  };

  const sendCommand = async (action: string) => {
    if (!selectedAccessory) {
      setError('Please select an accessory');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const requestBody: any = {
        accessory_name: selectedAccessory,
        action: action
      };

      // Add custom duration for timed actions
      if (action === 'timed' || action === 'toggle') {
        requestBody.milliseconds = customDuration;
      }

      const response = await fetch('/test/accessory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Command failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedAccessoryDetails = accessories.find(acc => acc.name === selectedAccessory);

  const getControlTypeColor = (controlType: string) => {
    switch (controlType) {
      case 'onOff': return 'primary';
      case 'toggle': return 'secondary';
      case 'timed': return 'warning';
      default: return 'default';
    }
  };

  const getActionButtons = () => {
    if (!selectedAccessoryDetails) return null;

    const { control_type } = selectedAccessoryDetails;
    
    switch (control_type) {
      case 'onOff':
        return (
          <>
            <Button
              startIcon={<PlayArrowIcon />}
              onClick={() => sendCommand('on')}
              variant="contained"
              color="success"
              disabled={loading}
            >
              Turn On
            </Button>
            <Button
              startIcon={<StopIcon />}
              onClick={() => sendCommand('off')}
              variant="contained"
              color="error"
              disabled={loading}
            >
              Turn Off
            </Button>
          </>
        );
      
      case 'toggle':
        return (
          <Button
            startIcon={<ToggleOffIcon />}
            onClick={() => sendCommand('toggle')}
            variant="contained"
            color="secondary"
            disabled={loading}
          >
            Toggle ({customDuration}ms)
          </Button>
        );
      
      case 'timed':
        return (
          <Button
            startIcon={<TimerIcon />}
            onClick={() => sendCommand('timed')}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            Timed Pulse ({customDuration}ms)
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        TrainStation Accessory Tester
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Test end-to-end communication between the FastAPI backend, ESP32 nodes, and accessory relays.
        This interface demonstrates the mapping defined in accessory_map.yaml.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Accessory Control
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Accessory</InputLabel>
            <Select
              value={selectedAccessory}
              onChange={(e) => setSelectedAccessory(e.target.value)}
              label="Select Accessory"
            >
              {accessories.map((accessory) => (
                <MenuItem key={accessory.name} value={accessory.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography>{accessory.name}</Typography>
                    <Chip 
                      label={accessory.control_type} 
                      size="small" 
                      color={getControlTypeColor(accessory.control_type)}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto' }}>
                      {accessory.esp32_node}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedAccessoryDetails && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {selectedAccessoryDetails.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedAccessoryDetails.description}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                ESP32 Node: {selectedAccessoryDetails.esp32_node} | 
                Control Type: {selectedAccessoryDetails.control_type}
              </Typography>
            </Box>
          )}

          {(selectedAccessoryDetails?.control_type === 'timed' || 
            selectedAccessoryDetails?.control_type === 'toggle') && (
            <TextField
              label="Duration (milliseconds)"
              type="number"
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              sx={{ mb: 2, width: 200 }}
              inputProps={{ min: 100, max: 30000, step: 100 }}
            />
          )}

          <ButtonGroup 
            variant="contained" 
            disabled={!selectedAccessory || loading}
            sx={{ gap: 1 }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography>Sending command...</Typography>
              </Box>
            ) : (
              getActionButtons()
            )}
          </ButtonGroup>
        </CardContent>
      </Card>

      {result && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              ✓ Command Sent Successfully
            </Typography>
            
            <Alert severity="success" sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            
            <Typography variant="body2" paragraph>
              <strong>Simulated Result:</strong> {result.simulated_result}
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Accessory</strong></TableCell>
                    <TableCell>{result.accessory_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Action</strong></TableCell>
                    <TableCell>{result.action}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>ESP32 Node</strong></TableCell>
                    <TableCell>{result.esp32_node}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Hardware Address</strong></TableCell>
                    <TableCell>{result.hardware_address}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Pin</strong></TableCell>
                    <TableCell>{result.pin}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Control Type</strong></TableCell>
                    <TableCell>{result.control_type}</TableCell>
                  </TableRow>
                  {result.milliseconds && (
                    <TableRow>
                      <TableCell><strong>Duration</strong></TableCell>
                      <TableCell>{result.milliseconds}ms</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">ESP32 Nodes Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Node ID</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Port</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {esp32Nodes.map((node) => (
                  <TableRow key={node.node_id}>
                    <TableCell>{node.node_id}</TableCell>
                    <TableCell>{node.ip}:{node.port}</TableCell>
                    <TableCell>{node.port}</TableCell>
                    <TableCell>{node.location}</TableCell>
                    <TableCell>{node.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Available Accessories</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>ESP32 Node</TableCell>
                  <TableCell>Control Type</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accessories.map((accessory) => (
                  <TableRow key={accessory.name}>
                    <TableCell>{accessory.name}</TableCell>
                    <TableCell>{accessory.esp32_node}</TableCell>
                    <TableCell>
                      <Chip 
                        label={accessory.control_type} 
                        size="small" 
                        color={getControlTypeColor(accessory.control_type)}
                      />
                    </TableCell>
                    <TableCell>{accessory.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default AccessoryTester;