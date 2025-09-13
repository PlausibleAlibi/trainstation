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
  CallSplit as SwitchIcon,
} from '@mui/icons-material';
import { EntityModal, DeleteConfirmationModal } from './components/modal';
import { createSwitchModalConfig } from './components/configs/modalConfigs';

// Types
type Accessory = {
  id: number;
  name: string;
  categoryId: number;
  controlType: string;
  address: string;
  isActive: boolean;
};

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
  kind: string;
  defaultRoute?: string;
  orientation?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  position: 'straight' | 'divergent' | 'unknown';
  isActive: boolean;
};

type SwitchWithRelations = Switch & {
  accessory?: Accessory;
  section?: Section;
};

type SwitchCreate = Omit<Switch, 'id'>;

// Component
export default function SwitchesManager() {
  const [switches, setSwitches] = useState<SwitchWithRelations[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSwitch, setEditingSwitch] = useState<SwitchWithRelations | null>(null);
  const [deletingSwitch, setDeletingSwitch] = useState<{ id: number; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');
  const [selectedPosition, setSelectedPosition] = useState<string | 'all'>('all');

  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  // Create modal configuration
  const modalConfig = useMemo(() => createSwitchModalConfig(accessories, sections), [accessories, sections]);

  // API helper
  async function apiCall<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  // Load data
  const loadSwitches = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        includeRelations: 'true',
        ...(selectedSection !== 'all' && { sectionId: String(selectedSection) }),
        ...(selectedPosition !== 'all' && { position: selectedPosition }),
      });
      
      const response = await fetch(`${API}/switches?${params}`);
      const data = await apiCall<SwitchWithRelations[]>(response);
      setSwitches(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load switches');
    } finally {
      setLoading(false);
    }
  };

  const loadAccessories = async () => {
    try {
      const response = await fetch(`${API}/accessories?active=true`);
      const data = await apiCall<Accessory[]>(response);
      setAccessories(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load accessories');
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

  useEffect(() => {
    loadAccessories();
    loadSections();
  }, []);

  useEffect(() => {
    loadSwitches();
  }, [selectedSection, selectedPosition]);

  // Open dialog for create/edit
  const openDialog = (switchItem?: SwitchWithRelations) => {
    setEditingSwitch(switchItem || null);
    setDialogOpen(true);
    setError(null);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSwitch(null);
    setError(null);
  };

  // Save switch
  const saveSwitch = async (formData: SwitchCreate) => {
    setSaving(true);
    setError(null);
    try {
      const url = editingSwitch ? `${API}/switches/${editingSwitch.id}` : `${API}/switches`;
      const method = editingSwitch ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          accessoryId: formData.accessoryId,
          sectionId: formData.sectionId,
          position: formData.position,
          isActive: formData.isActive,
        }),
      });
      
      await apiCall(response);
      await loadSwitches();
      closeDialog();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save switch';
      setError(errorMessage);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (switchItem: SwitchWithRelations) => {
    setDeletingSwitch({ id: switchItem.id, name: switchItem.name });
    setDeleteModalOpen(true);
  };

  // Close delete confirmation
  const closeDeleteConfirmation = () => {
    setDeleteModalOpen(false);
    setDeletingSwitch(null);
  };

  // Delete switch
  const deleteSwitch = async () => {
    if (!deletingSwitch) return;

    setError(null);
    try {
      const response = await fetch(`${API}/switches/${deletingSwitch.id}`, { method: 'DELETE' });
      await apiCall(response);
      await loadSwitches();
      closeDeleteConfirmation();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete switch';
      setError(errorMessage);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'straight': return 'success';
      case 'divergent': return 'info';
      case 'unknown': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SwitchIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Track Switches
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
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as number | 'all')}
              label="Section"
            >
              <MenuItem value="all">All Sections</MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Position</InputLabel>
            <Select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value as string)}
              label="Position"
            >
              <MenuItem value="all">All Positions</MenuItem>
              <MenuItem value="straight">Straight</MenuItem>
              <MenuItem value="divergent">Divergent</MenuItem>
              <MenuItem value="unknown">Unknown</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog()}
              disabled={accessories.length === 0 || sections.length === 0}
            >
              Add Switch
            </Button>
          </Box>
        </Box>
        {(accessories.length === 0 || sections.length === 0) && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            You must create at least one accessory and one section before you can add a switch. Please add them in their respective tabs.
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
              Switches ({switches.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Accessory</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell width="150">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {switches.map((switchItem) => (
                  <TableRow key={switchItem.id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {switchItem.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {switchItem.accessory?.name || `ID: ${switchItem.accessoryId}`}
                      </Typography>
                      {switchItem.accessory && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {switchItem.accessory.address}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {switchItem.section?.name || `ID: ${switchItem.sectionId}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={switchItem.position}
                        color={getPositionColor(switchItem.position) as any}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={switchItem.isActive ? 'Active' : 'Inactive'}
                        color={switchItem.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openDialog(switchItem)}
                        color="primary"
                        aria-label={`Edit switch ${switchItem.name}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteConfirmation(switchItem)}
                        color="error"
                        aria-label={`Delete switch ${switchItem.name}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {switches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No switches found. Create your first switch to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create/Edit Modal */}
      <EntityModal<SwitchCreate>
        open={dialogOpen}
        onClose={closeDialog}
        onSave={saveSwitch}
        config={modalConfig}
        initialData={editingSwitch ? {
          name: editingSwitch.name,
          accessoryId: editingSwitch.accessoryId,
          sectionId: editingSwitch.sectionId,
          position: editingSwitch.position,
          isActive: editingSwitch.isActive,
        } : undefined}
        isEditing={!!editingSwitch}
        loading={saving}
        error={error}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={deleteSwitch}
        entityName={deletingSwitch?.name || ''}
        entityType="Switch"
        warning="This may affect section connections."
        loading={saving}
      />
    </Box>
  );
}