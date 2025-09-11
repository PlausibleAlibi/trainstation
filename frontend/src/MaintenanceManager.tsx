import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as MaintenanceIcon,
} from '@mui/icons-material';

// TypeScript interfaces for TrainAsset
interface TrainAsset {
  id: number;
  assetId?: string;
  rfidTagId: string;
  type: TrainAssetType;
  roadNumber: string;
  description?: string;
  active: boolean;
  dateAdded: string;
  lastServicedDate?: string; // Placeholder field for future backend integration
  maintenanceStatus?: 'Good' | 'Needs Service' | 'Out of Service'; // Placeholder field
}

type TrainAssetType = 'Engine' | 'Car' | 'Caboose' | 'Locomotive' | 'FreightCar' | 'PassengerCar';

type TrainAssetCreate = Omit<TrainAsset, 'id' | 'dateAdded'>;

// Mock API configuration (placeholder for future backend integration)
// const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Component
export default function MaintenanceManager() {
  // State management
  const [trainAssets, setTrainAssets] = useState<TrainAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<TrainAssetCreate>({
    assetId: '',
    rfidTagId: '',
    type: 'Engine',
    roadNumber: '',
    description: '',
    active: true,
    lastServicedDate: '',
    maintenanceStatus: 'Good',
  });

  // API helper (placeholder - will be wired to actual backend later)
  // async function apiCall<T>(res: Response): Promise<T> {
  //   if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  //   return res.json();
  // }

  // Load train assets (placeholder implementation)
  const loadTrainAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Placeholder: Mock data for now, will be replaced with actual API call
      // const response = await fetch(`${API}/trainAssets`);
      // const data = await apiCall<TrainAsset[]>(response);
      
      // Mock data for UI development
      const mockData: TrainAsset[] = [
        {
          id: 1,
          assetId: 'LOC001',
          rfidTagId: 'RFID123456',
          type: 'Locomotive',
          roadNumber: 'UP-1234',
          description: 'Union Pacific SD70ACe Locomotive',
          active: true,
          dateAdded: '2024-01-15T10:00:00Z',
          lastServicedDate: '2024-08-15T10:00:00Z',
          maintenanceStatus: 'Good',
        },
        {
          id: 2,
          assetId: 'CAR001',
          rfidTagId: 'RFID789012',
          type: 'FreightCar',
          roadNumber: 'BNSF-5678',
          description: 'BNSF Grain Hopper Car',
          active: true,
          dateAdded: '2024-02-20T14:30:00Z',
          lastServicedDate: '2024-07-10T09:00:00Z',
          maintenanceStatus: 'Needs Service',
        },
        {
          id: 3,
          assetId: 'CAB001',
          rfidTagId: 'RFID345678',
          type: 'Caboose',
          roadNumber: 'SP-9999',
          description: 'Southern Pacific Caboose',
          active: false,
          dateAdded: '2024-03-05T16:45:00Z',
          lastServicedDate: '2024-05-20T11:00:00Z',
          maintenanceStatus: 'Out of Service',
        },
      ];
      
      setTrainAssets(mockData);
    } catch (e: any) {
      setError(e.message || 'Failed to load train assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainAssets();
  }, []);

  // Open dialog for create/edit
  const openDialog = (asset?: TrainAsset) => {
    if (asset) {
      setEditingId(asset.id);
      setFormData({
        assetId: asset.assetId || '',
        rfidTagId: asset.rfidTagId,
        type: asset.type,
        roadNumber: asset.roadNumber,
        description: asset.description || '',
        active: asset.active,
        lastServicedDate: asset.lastServicedDate || '',
        maintenanceStatus: asset.maintenanceStatus || 'Good',
      });
    } else {
      setEditingId(null);
      setFormData({
        assetId: '',
        rfidTagId: '',
        type: 'Engine',
        roadNumber: '',
        description: '',
        active: true,
        lastServicedDate: '',
        maintenanceStatus: 'Good',
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  // Save train asset (placeholder implementation)
  const saveTrainAsset = async () => {
    setSaving(true);
    setError(null);
    try {
      // Placeholder: Will be replaced with actual API calls
      if (editingId) {
        // Update existing asset
        // const response = await fetch(`${API}/trainAssets/${editingId}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData),
        // });
        // await apiCall<TrainAsset>(response);
        
        // Mock update
        setTrainAssets(prev => prev.map(asset => 
          asset.id === editingId 
            ? { ...asset, ...formData, id: editingId, dateAdded: asset.dateAdded }
            : asset
        ));
      } else {
        // Create new asset
        // const response = await fetch(`${API}/trainAssets`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData),
        // });
        // const newAsset = await apiCall<TrainAsset>(response);
        
        // Mock create
        const newAsset: TrainAsset = {
          ...formData,
          id: Date.now(), // Mock ID
          dateAdded: new Date().toISOString(),
        };
        setTrainAssets(prev => [...prev, newAsset]);
      }
      closeDialog();
    } catch (e: any) {
      setError(e.message || 'Failed to save train asset');
    } finally {
      setSaving(false);
    }
  };

  // Delete train asset (placeholder implementation)
  const deleteTrainAsset = async (id: number, description: string) => {
    if (!window.confirm(`Are you sure you want to delete "${description}"?`)) {
      return;
    }

    try {
      // Placeholder: Will be replaced with actual API call
      // const response = await fetch(`${API}/trainAssets/${id}`, {
      //   method: 'DELETE',
      // });
      // await apiCall<void>(response);
      
      // Mock delete
      setTrainAssets(prev => prev.filter(asset => asset.id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to delete train asset');
    }
  };

  // Get maintenance status color
  const getMaintenanceStatusColor = (status?: string) => {
    switch (status) {
      case 'Good': return 'success';
      case 'Needs Service': return 'warning';
      case 'Out of Service': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MaintenanceIcon />
        Train Assets Maintenance
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Train Assets ({trainAssets.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog()}
            >
              Add Train Asset
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset ID / Road Number</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Last Serviced</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell width="150">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trainAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {asset.assetId || asset.roadNumber}
                        </Typography>
                        {asset.assetId && (
                          <Typography variant="body2" color="text.secondary">
                            {asset.roadNumber}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={asset.type} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {asset.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {asset.lastServicedDate ? (
                        <Typography variant="body2">
                          {new Date(asset.lastServicedDate).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not recorded
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          label={asset.active ? 'Active' : 'Inactive'}
                          color={asset.active ? 'success' : 'default'}
                        />
                        {asset.maintenanceStatus && (
                          <Chip
                            size="small"
                            label={asset.maintenanceStatus}
                            color={getMaintenanceStatusColor(asset.maintenanceStatus) as any}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openDialog(asset)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteTrainAsset(asset.id, asset.description || asset.roadNumber)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {trainAssets.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No train assets found. Click "Add Train Asset" to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? 'Edit Train Asset' : 'Add Train Asset'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Asset ID (Optional)"
              value={formData.assetId}
              onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
              fullWidth
              helperText="Client-readable identifier"
            />
            
            <TextField
              label="RFID Tag ID"
              value={formData.rfidTagId}
              onChange={(e) => setFormData({ ...formData, rfidTagId: e.target.value })}
              fullWidth
              required
              helperText="Unique RFID tag identifier"
            />

            <FormControl fullWidth required>
              <InputLabel>Asset Type</InputLabel>
              <Select
                value={formData.type}
                label="Asset Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TrainAssetType })}
              >
                <MenuItem value="Engine">Engine</MenuItem>
                <MenuItem value="Locomotive">Locomotive</MenuItem>
                <MenuItem value="Car">Car</MenuItem>
                <MenuItem value="FreightCar">Freight Car</MenuItem>
                <MenuItem value="PassengerCar">Passenger Car</MenuItem>
                <MenuItem value="Caboose">Caboose</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Road Number"
              value={formData.roadNumber}
              onChange={(e) => setFormData({ ...formData, roadNumber: e.target.value })}
              fullWidth
              required
              helperText="Railroad asset number"
            />

            <TextField
              label="Description / Notes"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              helperText="Optional description or maintenance notes"
            />

            <TextField
              label="Last Serviced Date"
              type="date"
              value={formData.lastServicedDate}
              onChange={(e) => setFormData({ ...formData, lastServicedDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Last maintenance service date (optional)"
            />

            <FormControl fullWidth>
              <InputLabel>Maintenance Status</InputLabel>
              <Select
                value={formData.maintenanceStatus}
                label="Maintenance Status"
                onChange={(e) => setFormData({ ...formData, maintenanceStatus: e.target.value as any })}
              >
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Needs Service">Needs Service</MenuItem>
                <MenuItem value="Out of Service">Out of Service</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={saveTrainAsset}
            variant="contained"
            disabled={saving || !formData.rfidTagId.trim() || !formData.roadNumber.trim()}
          >
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}