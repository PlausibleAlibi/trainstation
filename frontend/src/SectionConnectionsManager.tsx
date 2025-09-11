import { useState, useEffect, useMemo } from 'react';
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
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Hub as ConnectionIcon,
  ArrowRightAlt as ArrowIcon,
} from '@mui/icons-material';
import { EntityModal, DeleteConfirmationModal } from './components/modal';
import { createConnectionModalConfig } from './components/configs/modalConfigs';

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SectionConnectionWithRelations | null>(null);
  const [deletingConnection, setDeletingConnection] = useState<{ id: number; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedConnectionType, setSelectedConnectionType] = useState<string | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');

  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  // Create modal configuration
  const modalConfig = useMemo(() => createConnectionModalConfig(sections, switches), [sections, switches]);

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
    setEditingConnection(connection || null);
    setDialogOpen(true);
    setError(null);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingConnection(null);
    setError(null);
  };

  // Save connection
  const saveConnection = async (formData: SectionConnectionCreate) => {
    setSaving(true);
    setError(null);
    try {
      const url = editingConnection ? `${API}/sectionConnections/${editingConnection.id}` : `${API}/sectionConnections`;
      const method = editingConnection ? 'PUT' : 'POST';
      
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save connection';
      setError(errorMessage);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (connection: SectionConnectionWithRelations) => {
    const connectionName = `${getSectionName(connection.fromSectionId)} → ${getSectionName(connection.toSectionId)}`;
    setDeletingConnection({ id: connection.id, name: connectionName });
    setDeleteModalOpen(true);
  };

  // Close delete confirmation
  const closeDeleteConfirmation = () => {
    setDeleteModalOpen(false);
    setDeletingConnection(null);
  };

  // Delete connection
  const deleteConnection = async () => {
    if (!deletingConnection) return;

    setError(null);
    try {
      const response = await fetch(`${API}/sectionConnections/${deletingConnection.id}`, { method: 'DELETE' });
      await apiCall(response);
      await loadConnections();
      closeDeleteConfirmation();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete connection';
      setError(errorMessage);
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
                        aria-label="Edit connection"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteConfirmation(connection)}
                        color="error"
                        aria-label="Delete connection"
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

      {/* Create/Edit Modal */}
      <EntityModal<SectionConnectionCreate>
        open={dialogOpen}
        onClose={closeDialog}
        onSave={saveConnection}
        config={modalConfig}
        initialData={editingConnection ? {
          fromSectionId: editingConnection.fromSectionId,
          toSectionId: editingConnection.toSectionId,
          connectionType: editingConnection.connectionType,
          switchId: editingConnection.switchId,
          isActive: editingConnection.isActive,
        } : undefined}
        isEditing={!!editingConnection}
        loading={saving}
        error={error}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={deleteConnection}
        entityName={deletingConnection?.name || ''}
        entityType="Connection"
        loading={saving}
      />
    </Box>
  );
}