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
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Train as TrainIcon,
} from '@mui/icons-material';

// Types
type TrackLine = {
  id: number;
  name: string;
  description?: string;
  length?: number;
  isActive: boolean;
};

type TrackLineCreate = Omit<TrackLine, 'id'>;

// Component
export default function TrackLinesManager() {
  const [trackLines, setTrackLines] = useState<TrackLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TrackLineCreate>({
    name: '',
    description: '',
    length: undefined,
    isActive: true,
  });

  const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

  // API helper
  async function apiCall<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  // Load track lines
  const loadTrackLines = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API}/trackLines`);
      const data = await apiCall<TrackLine[]>(response);
      setTrackLines(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load track lines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackLines();
  }, []);

  // Open dialog for create/edit
  const openDialog = (trackLine?: TrackLine) => {
    if (trackLine) {
      setEditingId(trackLine.id);
      setFormData({
        name: trackLine.name,
        description: trackLine.description || '',
        length: trackLine.length,
        isActive: trackLine.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        length: undefined,
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

  // Save track line
  const saveTrackLine = async () => {
    if (!formData.name.trim()) {
      setError('Track line name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `${API}/trackLines/${editingId}` : `${API}/trackLines`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          length: formData.length || null,
          isActive: formData.isActive,
        }),
      });
      
      await apiCall(response);
      await loadTrackLines();
      closeDialog();
    } catch (e: any) {
      setError(e.message || 'Failed to save track line');
    } finally {
      setSaving(false);
    }
  };

  // Delete track line
  const deleteTrackLine = async (id: number, name: string) => {
    if (!confirm(`Delete track line "${name}"? This will also remove all associated sections.`)) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`${API}/trackLines/${id}`, { method: 'DELETE' });
      await apiCall(response);
      await loadTrackLines();
    } catch (e: any) {
      setError(e.message || 'Failed to delete track line');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrainIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Track Lines
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Track Lines ({trackLines.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog()}
            >
              Add Track Line
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
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Length</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell width="150">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trackLines.map((trackLine) => (
                  <TableRow key={trackLine.id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {trackLine.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {trackLine.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {trackLine.length ? `${trackLine.length}ft` : '—'}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: trackLine.isActive ? 'success.main' : 'grey.400',
                          color: 'white',
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          minWidth: 60,
                        }}
                      >
                        {trackLine.isActive ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openDialog(trackLine)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteTrackLine(trackLine.id, trackLine.name)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {trackLines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No track lines found. Create your first track line to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Track Line' : 'Create Track Line'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Length (feet)"
              type="number"
              value={formData.length || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                length: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              fullWidth
            />
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
            onClick={saveTrackLine}
            variant="contained"
            disabled={saving || !formData.name.trim()}
          >
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}