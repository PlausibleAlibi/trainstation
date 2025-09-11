import { useState, useEffect, useMemo } from 'react';
import EntityForm from './components/EntityForm';
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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LinearScale as SectionIcon } from '@mui/icons-material';
// ...existing code...
// ...existing code...
import { DeleteConfirmationModal } from './components/modal';

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
  startPosition?: number;
  endPosition?: number;
  length?: number;
  isOccupied: boolean;
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
  // Load all track lines
  const loadTrackLines = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/tracklines`);
      const data = await apiCall<TrackLine[]>(response);
      setTrackLines(data);
    } catch (e) {
      setError('Failed to load track lines');
    } finally {
      setLoading(false);
    }
  };

  // Load all sections (optionally filtered)
  const loadSections = async () => {
    setLoading(true);
    try {
      let url = `${API}/sections`;
      if (selectedTrackLine !== 'all') {
        url += `?trackLineId=${selectedTrackLine}`;
      }
      const response = await fetch(url);
      let data = await apiCall<SectionWithTrackLine[]>(response);
      if (showOccupiedOnly) {
        data = data.filter((section) => section.isOccupied);
      }
      setSections(data);
    } catch (e) {
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithTrackLine | null>(null);
  const [deletingSection, setDeletingSection] = useState<{ id: number; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedTrackLine, setSelectedTrackLine] = useState<number | 'all'>('all');
  const [showOccupiedOnly, setShowOccupiedOnly] = useState(false);

  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  // Create modal configuration
// ...existing code...

  // API helper
  async function apiCall<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  useEffect(() => {
    loadTrackLines();
  }, []);

  useEffect(() => {
    loadSections();
  }, [selectedTrackLine, showOccupiedOnly]);

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
          startPosition: formData.startPosition || null,
          endPosition: formData.endPosition || null,
          length: formData.length || null,
          isOccupied: formData.isOccupied,
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
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SectionIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Track Sections
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
          
          <FormControlLabel
            control={
              <Checkbox
                checked={showOccupiedOnly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowOccupiedOnly(e.target.checked)}
              />
            }
            label="Occupied only"
          />

          <Box sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog()}
              disabled={trackLines.length === 0}
            >
              Add Section
            </Button>
          </Box>
        </Box>
        {trackLines.length === 0 && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            You must create at least one track line before you can add a section. Go to the "Track Lines" tab and create a track line.
          </Typography>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(groupedSections).map(([trackLineName, trackLineSections]) => (
            <Paper key={trackLineName}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
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
                            {section.startPosition !== undefined && section.endPosition !== undefined
                              ? `${section.startPosition} - ${section.endPosition}`
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {section.length ? `${section.length}ft` : '—'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              size="small"
                              label={section.isActive ? 'Active' : 'Inactive'}
                              color={section.isActive ? 'success' : 'default'}
                            />
                            {section.isOccupied && (
                              <Chip size="small" label="Occupied" color="warning" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openDialog(section)}
                            color="primary"
                            aria-label={`Edit section ${section.name}`}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openDeleteConfirmation(section)}
                            color="error"
                            aria-label={`Delete section ${section.name}`}
                          >
                            <DeleteIcon />
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
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No sections found. Create your first section to get started.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Create/Edit Modal */}
      {dialogOpen && (
        <Paper sx={{ p: 3, maxWidth: 400, margin: '32px auto', position: 'relative', zIndex: 1300 }}>
          <EntityForm
            title={editingSection ? 'Edit Section' : 'New Section'}
            onSubmit={(e) => {
              e.preventDefault();
              // Gather form data from state and call saveSection
              // You may need to refactor state to support this
              // For now, call saveSection with editingSection or default values
              if (editingSection) {
                saveSection({
                  name: editingSection.name,
                  trackLineId: editingSection.trackLineId,
                  startPosition: editingSection.startPosition,
                  endPosition: editingSection.endPosition,
                  length: editingSection.length,
                  isOccupied: editingSection.isOccupied,
                  isActive: editingSection.isActive,
                });
              } else {
                saveSection({
                  name: '',
                  trackLineId: trackLines[0]?.id || 0,
                  startPosition: 0,
                  endPosition: 0,
                  length: 0,
                  isOccupied: false,
                  isActive: true,
                });
              }
            }}
            loading={saving}
            fields={[
              {
                name: 'name',
                label: 'Name',
                value: editingSection?.name ?? '',
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingSection({ ...editingSection, name: e.target.value } as SectionWithTrackLine),
              },
              {
                name: 'trackLineId',
                label: 'Track Line',
                type: 'select',
                value: editingSection?.trackLineId ?? trackLines[0]?.id ?? '',
                onChange: (e: React.ChangeEvent<{ value: unknown }>) => setEditingSection({ ...editingSection, trackLineId: Number(e.target.value) } as SectionWithTrackLine),
                options: trackLines.map((tl) => ({ value: tl.id, label: tl.name })),
              },
              {
                name: 'startPosition',
                label: 'Start Position',
                type: 'number',
                value: editingSection?.startPosition ?? 0,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingSection({ ...editingSection, startPosition: Number(e.target.value) } as SectionWithTrackLine),
              },
              {
                name: 'endPosition',
                label: 'End Position',
                type: 'number',
                value: editingSection?.endPosition ?? 0,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingSection({ ...editingSection, endPosition: Number(e.target.value) } as SectionWithTrackLine),
              },
              {
                name: 'length',
                label: 'Length',
                type: 'number',
                value: editingSection?.length ?? 0,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingSection({ ...editingSection, length: Number(e.target.value) } as SectionWithTrackLine),
              },
              {
                name: 'isOccupied',
                label: 'Occupied',
                type: 'checkbox',
                value: editingSection?.isOccupied ?? false,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingSection({ ...editingSection, isOccupied: e.target.checked } as SectionWithTrackLine),
              },
              {
                name: 'isActive',
                label: 'Active',
                type: 'checkbox',
                value: editingSection?.isActive ?? true,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditingSection({ ...editingSection, isActive: e.target.checked } as SectionWithTrackLine),
              },
            ]}
          />
          <Button onClick={closeDialog} sx={{ mt: 2 }} fullWidth>Cancel</Button>
        </Paper>
      )}

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