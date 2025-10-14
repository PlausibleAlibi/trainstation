import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Paper,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  Typography,
  Chip,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { spacing, buttonVariants } from '../shared/theme'
import { EntityModal, DeleteConfirmationModal } from './components/modal';
import { createAccessoryModalConfig, categoryModalConfig } from './components/configs/modalConfigs';

/* ================= Types ================= */
type Category = {
  id: number;
  name: string;
  description?: string | null;
  sortOrder: number;
};

type AccessoryRead = {
  id: number;
  name: string;
  categoryId: number;
  controlType: "onOff" | "toggle" | "timed";
  address: string;
  isActive: boolean;
  timedMs?: number | null;
};

type AccessoryWithCategory = AccessoryRead & { category?: Category | null };

/* ================= Config ================= */
// For now, talk directly to backend (compose maps 8080:8000).
// After adding Nginx, switch the fallback to "/api".
const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";



/* ================= App ================= */
export default function App() {
  /* ---- Data ---- */
  const [cats, setCats] = useState<Category[]>([]);
  const [selCat, setSelCat] = useState<number | "all">("all");

  const [accs, setAccs] = useState<AccessoryWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [onlyActive, setOnlyActive] = useState(false);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");

  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  const [toast, setToast] = useState<string | null>(null);

  // Polling for real-time updates
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const pollingInterval = 5000; // 5 seconds
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Accessory modal state
  const [accessoryDialogOpen, setAccessoryDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryWithCategory | null>(null);
  const [savingAccessory, setSavingAccessory] = useState(false);
  const [deleteAccessoryModalOpen, setDeleteAccessoryModalOpen] = useState(false);
  const [deletingAccessory, setDeletingAccessory] = useState<{ id: number; name: string } | null>(null);

  // Category modal state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<{ id: number; name: string } | null>(null);

  // Create modal configurations
  const accessoryModalConfig = useMemo(() => createAccessoryModalConfig(cats), [cats]);

  // API helper
  async function apiCall<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  /* ---- Loaders ---- */
  const loadCats = async () => {
    try {
      const response = await fetch(`${API}/categories`);
      const data = await apiCall<Category[]>(response);
      setCats(data);
    } catch (e) {
      setErr((e as Error).message || "Failed to load categories");
    }
  };

  const loadAccs = async (silent: boolean = false) => {
    const p = new URLSearchParams({
      includeCategory: "true",
      limit: String(limit),
      offset: String(offset),
    });
    if (selCat !== "all") p.set("categoryId", String(selCat));
    if (onlyActive) p.set("active", "true");
    if (qDebounced.trim()) p.set("q", qDebounced.trim());

    if (!silent) {
      setLoading(true);
      setErr(null);
    }
    try {
      const response = await fetch(`${API}/accessories?${p.toString()}`);
      const data = await apiCall<AccessoryWithCategory[]>(response);
      setAccs(data);
      setLastUpdated(new Date());
    } catch (e) {
      if (!silent) {
        setErr((e as Error).message || "Load failed");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  /* ---- Effects ---- */
  useEffect(() => {
    loadCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAccs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selCat, onlyActive, qDebounced, limit, offset]);

  // Reset pagination when filters change
  useEffect(() => { setOffset(0); }, [selCat, qDebounced, onlyActive]);

  // Polling effect for real-time updates
  useEffect(() => {
    if (!pollingEnabled) return;

    const intervalId = setInterval(() => {
      loadAccs(true); // Silent update
    }, pollingInterval);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingEnabled, pollingInterval, selCat, onlyActive, qDebounced, limit, offset]);

  /* ---- Derived ---- */
  const totalAll = useMemo(() => accs.length, [accs]); // quick display

  /* ---- Accessory Actions ---- */
  const openAccessoryDialog = (accessory?: AccessoryWithCategory) => {
    setEditingAccessory(accessory || null);
    setAccessoryDialogOpen(true);
    setErr(null);
  };

  const closeAccessoryDialog = () => {
    setAccessoryDialogOpen(false);
    setEditingAccessory(null);
    setErr(null);
  };

  const saveAccessory = async (formData: Omit<AccessoryRead, 'id'>) => {
    setSavingAccessory(true);
    setErr(null);
    try {
      const url = editingAccessory ? `${API}/accessories/${editingAccessory.id}` : `${API}/accessories`;
      const method = editingAccessory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          categoryId: formData.categoryId,
          controlType: formData.controlType,
          address: formData.address.trim(),
          isActive: formData.isActive,
          timedMs: formData.timedMs || null,
        }),
      });

      await apiCall(response);
      closeAccessoryDialog();
      if (!editingAccessory) setOffset(0); // Reset to first page on create
      await loadAccs();
      setToast(editingAccessory ? 'Accessory updated' : 'Accessory created');
    } catch (e) {
      setErr((e as Error).message || 'Failed to save accessory');
      throw e; // Re-throw to let modal handle it
    } finally {
      setSavingAccessory(false);
    }
  };

  const openDeleteAccessoryModal = (accessory: AccessoryWithCategory) => {
    setDeletingAccessory({ id: accessory.id, name: accessory.name });
    setDeleteAccessoryModalOpen(true);
  };

  const closeDeleteAccessoryModal = () => {
    setDeleteAccessoryModalOpen(false);
    setDeletingAccessory(null);
  };

  const confirmDeleteAccessory = async () => {
    if (!deletingAccessory) return;
    setErr(null);
    try {
      const response = await fetch(`${API}/accessories/${deletingAccessory.id}`, { method: 'DELETE' });
      await apiCall(response);
      closeDeleteAccessoryModal();
      await loadAccs();
      setToast('Accessory deleted');
    } catch (e) {
      setErr((e as Error).message || 'Failed to delete accessory');
      throw e;
    }
  };

  /* ---- Category Actions ---- */
  const openCategoryDialog = (category?: Category) => {
    setEditingCategory(category || null);
    setCategoryDialogOpen(true);
    setErr(null);
  };

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setErr(null);
  };

  const saveCategory = async (formData: Omit<Category, 'id'>) => {
    setSavingCategory(true);
    setErr(null);
    try {
      const url = editingCategory ? `${API}/categories/${editingCategory.id}` : `${API}/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          sortOrder: formData.sortOrder || 0,
        }),
      });

      await apiCall(response);
      closeCategoryDialog();
      await loadCats();
      setToast(editingCategory ? 'Category updated' : 'Category created');
    } catch (e) {
      setErr((e as Error).message || 'Failed to save category');
      throw e;
    } finally {
      setSavingCategory(false);
    }
  };

  const openDeleteCategoryModal = (category: Category) => {
    setDeletingCategory({ id: category.id, name: category.name });
    setDeleteCategoryModalOpen(true);
  };

  const closeDeleteCategoryModal = () => {
    setDeleteCategoryModalOpen(false);
    setDeletingCategory(null);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setErr(null);
    try {
      const response = await fetch(`${API}/categories/${deletingCategory.id}`, { method: 'DELETE' });
      await apiCall(response);
      closeDeleteCategoryModal();
      await loadCats();
      setToast('Category deleted');
      // Reset filter if deleted category was selected
      if (selCat === deletingCategory.id) {
        setSelCat('all');
      }
    } catch (e) {
      setErr((e as Error).message || 'Failed to delete category');
      throw e;
    }
  };

  /* ---- Accessory Control Actions ---- */
  const act = async (id: number, kind: "on" | "off" | "apply", body?: unknown, msg?: string) => {
    const url = kind === "apply" ? `${API}/actions/accessories/${id}/apply` : `${API}/actions/accessories/${id}/${kind}`;
    setErr(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      await apiCall(response);
      if (msg) setToast(msg);
    } catch (e) {
      setErr((e as Error).message || "Action failed");
    }
  };

  /* ---- UI ---- */
  return (
    <>
      <Container maxWidth="xl" sx={{ py: spacing.md }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: spacing.md }}>
          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
            <Paper sx={{ p: spacing.md, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: spacing.md }}>
                <Typography variant="h6">
                  Categories
                </Typography>
                <IconButton
                  onClick={() => openCategoryDialog()}
                  color="primary"
                  size="small"
                  title="Add Category"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Button
                onClick={() => setSelCat("all")}
                variant={selCat === "all" ? "contained" : "outlined"}
                fullWidth
                sx={{ mb: spacing.sm, justifyContent: 'space-between' }}
              >
                <span>All</span>
                <span style={{ opacity: 0.7 }}>{totalAll}</span>
              </Button>

              {cats
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
                .map((c) => (
                  <Box key={c.id} sx={{ display: 'flex', gap: spacing.xs, mb: spacing.sm }}>
                    <Button
                      onClick={() => setSelCat(c.id)}
                      variant={selCat === c.id ? "contained" : "outlined"}
                      fullWidth
                      sx={{ flex: 1 }}
                    >
                      {c.name}
                    </Button>
                    <IconButton
                      onClick={() => openCategoryDialog(c)}
                      size="small"
                      title="Edit Category"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => openDeleteCategoryModal(c)}
                      size="small"
                      color="error"
                      title="Delete Category"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
            </Paper>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: spacing.md }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: spacing.md }}>
                <Typography variant="h5">
                  Accessories & Categories
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openAccessoryDialog()}
                  {...buttonVariants.primary}
                >
                  Add Accessory
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: spacing.md, alignItems: 'center', mb: spacing.md, flexWrap: 'wrap' }}>
                <TextField
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  label="Search accessories…"
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={onlyActive}
                      onChange={(e) => setOnlyActive(e.target.checked)}
                    />
                  }
                  label="Active only"
                />
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Page size</InputLabel>
                  <Select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
                    label="Page size"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  {...buttonVariants.outline}
                  size="small"
                >
                  ‹ Prev
                </Button>
                <Button
                  disabled={accs.length < limit}
                  onClick={() => setOffset(offset + limit)}
                  {...buttonVariants.outline}
                  size="small"
                >
                  Next ›
                </Button>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={pollingEnabled}
                      onChange={(e) => setPollingEnabled(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Auto-refresh"
                />
                {lastUpdated && (
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </Typography>
                )}
              </Box>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: spacing.lg }}>
                  <CircularProgress />
                </Box>
              )}
              
              {err && (
                <Alert severity="error" sx={{ mb: spacing.md }}>
                  {err}
                </Alert>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Timed (ms)</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accs.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.name}</TableCell>
                        <TableCell>{a.category?.name ?? a.categoryId}</TableCell>
                        <TableCell>{a.controlType}</TableCell>
                        <TableCell>{a.address}</TableCell>
                        <TableCell>
                          <Chip
                            label={a.isActive ? "Active" : "Inactive"}
                            color={a.isActive ? "success" : "default"}
                            size="small"
                            variant={a.isActive ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>{a.timedMs ?? "—"}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <Button
                              onClick={() => act(a.id, "on", undefined, "ON")}
                              disabled={!a.isActive}
                              {...buttonVariants.success}
                              size="small"
                            >
                              On
                            </Button>
                            <Button
                              onClick={() => act(a.id, "off", undefined, "OFF")}
                              disabled={!a.isActive}
                              {...buttonVariants.secondary}
                              size="small"
                            >
                              Off
                            </Button>
                            <Button
                              onClick={() => act(a.id, "apply", undefined, "Applied")}
                              disabled={!a.isActive}
                              {...buttonVariants.outline}
                              size="small"
                            >
                              Apply
                            </Button>
                            <Button
                              onClick={() => act(a.id, "apply", { milliseconds: 2000 }, "2s Applied")}
                              disabled={!a.isActive}
                              {...buttonVariants.outline}
                              size="small"
                            >
                              Apply 2s
                            </Button>
                            <IconButton
                              onClick={() => openAccessoryDialog(a)}
                              size="small"
                              title="Edit Accessory"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => openDeleteAccessoryModal(a)}
                              size="small"
                              color="error"
                              title="Delete Accessory"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {accs.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: spacing.lg, color: 'text.secondary' }}>
                          No accessories found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={!!toast}
        autoHideDuration={2200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast(null)} severity="success" sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>

      {/* Accessory Modal */}
      <EntityModal
        open={accessoryDialogOpen}
        onClose={closeAccessoryDialog}
        onSave={saveAccessory}
        config={accessoryModalConfig}
        initialData={editingAccessory || undefined}
        isEditing={!!editingAccessory}
        loading={savingAccessory}
        error={err}
      />

      {/* Category Modal */}
      <EntityModal
        open={categoryDialogOpen}
        onClose={closeCategoryDialog}
        onSave={saveCategory}
        config={categoryModalConfig}
        initialData={editingCategory || undefined}
        isEditing={!!editingCategory}
        loading={savingCategory}
        error={err}
      />

      {/* Delete Accessory Confirmation */}
      <DeleteConfirmationModal
        open={deleteAccessoryModalOpen}
        onClose={closeDeleteAccessoryModal}
        onConfirm={confirmDeleteAccessory}
        entityName={deletingAccessory?.name || ''}
        entityType="Accessory"
        warning="This will permanently delete the accessory and all its associated data."
      />

      {/* Delete Category Confirmation */}
      <DeleteConfirmationModal
        open={deleteCategoryModalOpen}
        onClose={closeDeleteCategoryModal}
        onConfirm={confirmDeleteCategory}
        entityName={deletingCategory?.name || ''}
        entityType="Category"
        warning="This will delete the category. Make sure no accessories are using this category."
      />
    </>
  );
}