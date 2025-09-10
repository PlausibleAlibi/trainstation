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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Hub as ConnectionIcon,
  ArrowRightAlt as ArrowIcon,
} from '@mui/icons-material';

// Types
type Section = {
  id: number;
  name: string;
  trackLineId: number;
  isActive: boolean;
};

type Switch = {
  id: number;
  name: string;
  accessoryId: number;
  sectionId: number;
  position: string;
  isActive: boolean;
};

type SectionConnection = {
  id: number;
  fromSectionId: number;
  toSectionId: number;
  connectionType: 'direct' | 'switch' | 'junction';
  switchId?: number;
  isActive: boolean;
};

type SectionConnectionWithRelations = SectionConnection & {
  fromSection?: Section;
  toSection?: Section;
  switch?: Switch;
};

type SectionConnectionCreate = Omit<SectionConnection, 'id'>;

// Component
export default function SectionConnectionsManager() {
  const [connections, setConnections] = useState<SectionConnectionWithRelations[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [switches, setSwitches] = useState<Switch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedConnectionType, setSelectedConnectionType] = useState<string | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState<SectionConnectionCreate>({
    fromSectionId: 0,
    toSectionId: 0,
    connectionType: 'direct',
    switchId: undefined,
    isActive: true,
  });

  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  // API helper
  async function apiCall<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  // Load data
  const loadConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        includeRelations: 'true',
        ...(selectedConnectionType !== 'all' && { connectionType: selectedConnectionType }),
        ...(selectedSection !== 'all' && { fromSectionId: String(selectedSection) }),
      });
      
      const response = await fetch(`${API}/sectionConnections?${params}`);
      const data = await apiCall<SectionConnectionWithRelations[]>(response);
      setConnections(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(`${API}/sections?active=true`);
      const data = await apiCall<Section[]>(response);
      setSections(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load sections');
    }
  };

  const loadSwitches = async () => {
    try {
      const response = await fetch(`${API}/switches?active=true`);
      const data = await apiCall<Switch[]>(response);
      setSwitches(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load switches');
    }
  };

  useEffect(() => {
    loadSections();
    loadSwitches();
  }, []);

  useEffect(() => {
    loadConnections();
  }, [selectedConnectionType, selectedSection]);

  // Open dialog for create/edit
  const openDialog = (connection?: SectionConnectionWithRelations) => {
    if (connection) {
      setEditingId(connection.id);
      setFormData({
        fromSectionId: connection.fromSectionId,
        toSectionId: connection.toSectionId,
        connectionType: connection.connectionType,
        switchId: connection.switchId,
        isActive: connection.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        fromSectionId: sections.length > 0 ? sections[0].id : 0,
        toSectionId: sections.length > 1 ? sections[1].id : 0,
        connectionType: 'direct',
        switchId: undefined,
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setError(null);
  };

  // Save connection
  const saveConnection = async () => {
    if (!formData.fromSectionId || !formData.toSectionId) {
      setError('Both from and to sections are required');
      return;
    }

    if (formData.fromSectionId === formData.toSectionId) {
      setError('From and to sections must be different');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `${API}/sectionConnections/${editingId}` : `${API}/sectionConnections`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSectionId: formData.fromSectionId,
          toSectionId: formData.toSectionId,
          connectionType: formData.connectionType,
          switchId: formData.switchId || null,
          isActive: formData.isActive,
        }),
      });
      
      await apiCall(response);
      await loadConnections();
      closeDialog();
    } catch (e: any) {
      setError(e.message || 'Failed to save connection');
    } finally {
      setSaving(false);
    }
  };

  // Delete connection
  const deleteConnection = async (id: number) => {
    if (!confirm('Delete this connection?')) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`${API}/sectionConnections/${id}`, { method: 'DELETE' });
      await apiCall(response);
      await loadConnections();
    } catch (e: any) {
      setError(e.message || 'Failed to delete connection');
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'success';
      case 'switch': return 'info';
      case 'junction': return 'warning';
      default: return 'default';
    }
  };

  const getSectionName = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : `ID: ${sectionId}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ConnectionIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Section Connections
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Connection Type</InputLabel>
            <Select
              value={selectedConnectionType}
              onChange={(e) => setSelectedConnectionType(e.target.value)}
              label="Connection Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="direct">Direct</MenuItem>
              <MenuItem value="switch">Switch</MenuItem>
              <MenuItem value="junction">Junction</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>From Section</InputLabel>
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as number | 'all')}
              label="From Section"
            >
              <MenuItem value="all">All Sections</MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog()}
              disabled={sections.length < 2}
            >
              Add Connection
            </Button>
          </Box>
        </Box>
        {sections.length < 2 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create at least two sections before adding connections.
          </Typography>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              Connections ({connections.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>From Section</TableCell>
                  <TableCell width="50"></TableCell>
                  <TableCell>To Section</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Switch</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell width="150">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {connections.map((connection) => (
                  <TableRow key={connection.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {connection.fromSection?.name || getSectionName(connection.fromSectionId)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <ArrowIcon color="action" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {connection.toSection?.name || getSectionName(connection.toSectionId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={connection.connectionType}
                        color={getConnectionTypeColor(connection.connectionType) as any}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      {connection.switch ? (
                        <Typography variant="body2">
                          {connection.switch.name}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={connection.isActive ? 'Active' : 'Inactive'}
                        color={connection.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openDialog(connection)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteConnection(connection.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {connections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No connections found. Create your first connection to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Connection' : 'Create Connection'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl required fullWidth>
              <InputLabel>From Section</InputLabel>
              <Select
                value={formData.fromSectionId}
                onChange={(e) => setFormData({ ...formData, fromSectionId: e.target.value as number })}
                label="From Section"
              >
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id} disabled={section.id === formData.toSectionId}>
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl required fullWidth>
              <InputLabel>To Section</InputLabel>
              <Select
                value={formData.toSectionId}
                onChange={(e) => setFormData({ ...formData, toSectionId: e.target.value as number })}
                label="To Section"
              >
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id} disabled={section.id === formData.fromSectionId}>
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Connection Type</InputLabel>
              <Select
                value={formData.connectionType}
                onChange={(e) => {
                  const newType = e.target.value as 'direct' | 'switch' | 'junction';
                  setFormData({ 
                    ...formData, 
                    connectionType: newType,
                    switchId: newType === 'switch' ? (switches[0]?.id || undefined) : undefined
                  });
                }}
                label="Connection Type"
              >
                <MenuItem value="direct">Direct</MenuItem>
                <MenuItem value="switch">Switch</MenuItem>
                <MenuItem value="junction">Junction</MenuItem>
              </Select>
            </FormControl>

            {formData.connectionType === 'switch' && (
              <FormControl fullWidth>
                <InputLabel>Switch</InputLabel>
                <Select
                  value={formData.switchId || ''}
                  onChange={(e) => setFormData({ ...formData, switchId: e.target.value as number })}
                  label="Switch"
                >
                  {switches.map((switchItem) => (
                    <MenuItem key={switchItem.id} value={switchItem.id}>
                      {switchItem.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={saveConnection}
            variant="contained"
            disabled={
              saving || 
              !formData.fromSectionId || 
              !formData.toSectionId || 
              formData.fromSectionId === formData.toSectionId ||
              (formData.connectionType === 'switch' && !formData.switchId)
            }
          >
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}