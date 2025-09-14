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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LinearScale as SectionIcon,
} from '@mui/icons-material';
import { EntityModal, DeleteConfirmationModal } from './components/modal';
import { createSectionModalConfig } from './components/configs/modalConfigs';
import { spacing, iconSizes, buttonVariants } from '../shared/theme';

// Types
type TrackLine = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
};

type Section = {
  id: number;
  name: string;
  trackLineId: number;
  length?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  isActive: boolean;
};

type SectionWithTrackLine = Section & {
  trackLine?: TrackLine;
};

type SectionCreate = Omit<Section, 'id'>;

// Component
export default function SectionsManager() {
  const [sections, setSections] = useState<SectionWithTrackLine[]>([]);
  const [trackLines, setTrackLines] = useState<TrackLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithTrackLine | null>(null);
  const [deletingSection, setDeletingSection] = useState<{ id: number; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedTrackLine, setSelectedTrackLine] = useState<number | 'all'>('all');

  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  // Create modal configuration
  const modalConfig = useMemo(() => createSectionModalConfig(trackLines), [trackLines]);

  // API helper
  async function apiCall<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  // Load data
  const loadSections = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        includeTrackLine: 'true',
        ...(selectedTrackLine !== 'all' && { trackLineId: String(selectedTrackLine) }),
      });
      
      const response = await fetch(`${API}/sections?${params}`);
      const data = await apiCall<SectionWithTrackLine[]>(response);
      setSections(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackLines = async () => {
    try {
      const response = await fetch(`${API}/trackLines?active=true`);
      const data = await apiCall<TrackLine[]>(response);
      setTrackLines(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load track lines');
    }
  };

  useEffect(() => {
    loadTrackLines();
  }, []);

  useEffect(() => {
    loadSections();
  }, [selectedTrackLine]);

  // Open dialog for create/edit
  const openDialog = (section?: SectionWithTrackLine) => {
    setEditingSection(section || null);
    setDialogOpen(true);
    setError(null);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSection(null);
    setError(null);
  };

  // Save section
  const saveSection = async (formData: SectionCreate) => {
    setSaving(true);
    setError(null);
    try {
      const url = editingSection ? `${API}/sections/${editingSection.id}` : `${API}/sections`;
      const method = editingSection ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          trackLineId: formData.trackLineId,
          length: formData.length || null,
          positionX: formData.positionX || null,
          positionY: formData.positionY || null,
          positionZ: formData.positionZ || null,
          isActive: formData.isActive,
        }),
      });
      
      await apiCall(response);
      await loadSections();
      closeDialog();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save section';
      setError(errorMessage);
      throw e; // Re-throw to let the modal handle the error state
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (section: SectionWithTrackLine) => {
    setDeletingSection({ id: section.id, name: section.name });
    setDeleteModalOpen(true);
  };

  // Close delete confirmation
  const closeDeleteConfirmation = () => {
    setDeleteModalOpen(false);
    setDeletingSection(null);
  };

  // Delete section
  const deleteSection = async () => {
    if (!deletingSection) return;

    setError(null);
    try {
      const response = await fetch(`${API}/sections/${deletingSection.id}`, { method: 'DELETE' });
      await apiCall(response);
      await loadSections();
      closeDeleteConfirmation();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete section';
      setError(errorMessage);
    }
  };

  // Group sections by track line for better display
  const groupedSections = sections.reduce((acc, section) => {
    const trackLineName = section.trackLine?.name || 'Unknown Track Line';
    if (!acc[trackLineName]) acc[trackLineName] = [];
    acc[trackLineName].push(section);
    return acc;
  }, {} as Record<string, SectionWithTrackLine[]>);

  return (
    <Box sx={{ p: spacing.md }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: spacing.lg }}>
        <SectionIcon sx={{ mr: spacing.md, color: 'primary.main', fontSize: iconSizes.large }} />
        <Typography variant="h4" component="h1">
          Track Sections
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: spacing.md }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: spacing.md, mb: spacing.md }}>
        <Box sx={{ display: 'flex', gap: spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Track Line</InputLabel>
            <Select
              value={selectedTrackLine}
              onChange={(e) => setSelectedTrackLine(e.target.value as number | 'all')}
              label="Track Line"
            >
              <MenuItem value="all">All Track Lines</MenuItem>
              {trackLines.map((tl) => (
                <MenuItem key={tl.id} value={tl.id}>
                  {tl.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto' }}>
            <Button
              {...buttonVariants.primary}
              startIcon={<AddIcon sx={{ fontSize: iconSizes.small }} />}
              onClick={() => openDialog()}
              disabled={trackLines.length === 0}
            >
              Add Section
            </Button>
          </Box>
        </Box>
        {trackLines.length === 0 && (
          <Typography variant="body2" color="error" sx={{ mt: spacing.sm }}>
            You must create at least one track line before you can add a section. Go to the "Track Lines" tab and create a track line.
          </Typography>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: spacing.xl }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {Object.entries(groupedSections).map(([trackLineName, trackLineSections]) => (
            <Paper key={trackLineName}>
              <Box sx={{ p: spacing.md, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h6">
                  {trackLineName} ({trackLineSections.length} sections)
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Length</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell width="150">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trackLineSections.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {section.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {(section.positionX !== undefined || section.positionY !== undefined || section.positionZ !== undefined)
                              ? `X:${section.positionX ?? '—'}, Y:${section.positionY ?? '—'}, Z:${section.positionZ ?? '—'}`
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {section.length ? `${section.length}ft` : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={section.isActive ? 'Active' : 'Inactive'}
                            color={section.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openDialog(section)}
                            color="primary"
                            aria-label={`Edit section ${section.name}`}
                          >
                            <EditIcon sx={{ fontSize: iconSizes.small }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openDeleteConfirmation(section)}
                            color="error"
                            aria-label={`Delete section ${section.name}`}
                          >
                            <DeleteIcon sx={{ fontSize: iconSizes.small }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
          
          {sections.length === 0 && (
            <Paper sx={{ p: spacing.xl, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No sections found. Create your first section to get started.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Create/Edit Modal */}
      <EntityModal<SectionCreate>
        open={dialogOpen}
        onClose={closeDialog}
        onSave={saveSection}
        config={modalConfig}
        initialData={editingSection ? {
          name: editingSection.name,
          trackLineId: editingSection.trackLineId,
          length: editingSection.length,
          positionX: editingSection.positionX,
          positionY: editingSection.positionY,
          positionZ: editingSection.positionZ,
          isActive: editingSection.isActive,
        } : undefined}
        isEditing={!!editingSection}
        loading={saving}
        error={error}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={deleteSection}
        entityName={deletingSection?.name || ''}
        entityType="Section"
        warning="This will also remove all associated switches and connections."
        loading={saving}
      />
    </Box>
  );
}