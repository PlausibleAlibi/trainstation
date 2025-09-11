import React from "react";
import EntityForm, { EntityField } from "./components/EntityForm";
import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Paper,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
} from '@mui/material'

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

/* Small helper to throw on non-2xx */
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

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

  // Create Accessory
  const [fName, setFName] = useState("");
  const [fCat, setFCat] = useState<number | "">("");
  const [fType, setFType] = useState<"onOff" | "toggle" | "timed">("onOff");
  const [fAddr, setFAddr] = useState("");
  const [fActive, setFActive] = useState(true);
  const [fTimedMs, setFTimedMs] = useState<number | "">("");
  const [creatingAcc, setCreatingAcc] = useState(false);

  // Create Category
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cSort, setCSort] = useState<number | "">("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Edit Accessory
  const [editId, setEditId] = useState<number | null>(null);
  const [eaName, setEaName] = useState("");
  const [eaCat, setEaCat] = useState<number | "">("");
  const [eaType, setEaType] = useState<"onOff" | "toggle" | "timed">("onOff");
  const [eaAddr, setEaAddr] = useState("");
  const [eaActive, setEaActive] = useState(true);
  const [eaTimedMs, setEaTimedMs] = useState<number | "">("");
  const [savingAcc, setSavingAcc] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---- Loaders ---- */
  const loadCats = async () => setCats(await j<Category[]>(await fetch(`${API}/categories`)));

  const loadAccs = async () => {
    const p = new URLSearchParams({
      includeCategory: "true",
      limit: String(limit),
      offset: String(offset),
    });
    if (selCat !== "all") p.set("categoryId", String(selCat));
    if (onlyActive) p.set("active", "true");
    if (qDebounced.trim()) p.set("q", qDebounced.trim());

    setLoading(true);
    setErr(null);
    try {
      setAccs(await j<AccessoryWithCategory[]>(await fetch(`${API}/accessories?${p.toString()}`)));
    } catch (e: any) {
      setErr(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Effects ---- */
  useEffect(() => {
    loadCats();
  }, []);

  useEffect(() => {
    loadAccs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selCat, onlyActive, qDebounced, limit, offset]);

  // Reset pagination when filters change
  useEffect(() => { setOffset(0); }, [selCat, qDebounced, onlyActive]);

  /* ---- Derived ---- */
  const totalAll = useMemo(() => accs.length, [accs]); // quick display

  /* ---- Actions ---- */
  const beginEdit = (a: AccessoryWithCategory) => {
    setEditId(a.id);
    setEaName(a.name);
    setEaCat(a.categoryId);
    setEaType(a.controlType);
    setEaAddr(a.address);
    setEaActive(a.isActive);
    setEaTimedMs(a.timedMs ?? "");
  };

  const cancelEdit = () => setEditId(null);

  const saveAccessory = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!eaName || !eaCat || !eaAddr) { setErr("Fill Name, Category, and Address"); return; }
    setSavingAcc(true);
    setErr(null);
    try {
      await j(await fetch(`${API}/accessories/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: eaName,
          categoryId: Number(eaCat),
          controlType: eaType,
          address: eaAddr,
          isActive: eaActive,
          timedMs: eaTimedMs === "" ? null : Number(eaTimedMs),
        }),
      }));
      setEditId(null);
      await loadAccs();
      setToast("Accessory updated");
    } catch (e: any) {
      setErr(e.message || "Update failed");
    } finally {
      setSavingAcc(false);
    }
  };

  const act = async (id: number, kind: "on" | "off" | "apply", body?: any, msg?: string) => {
    const url = kind === "apply" ? `${API}/actions/accessories/${id}/apply` : `${API}/actions/accessories/${id}/${kind}`;
    setErr(null);
    try {
      await j(await fetch(url, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }));
      if (msg) setToast(msg);
    } catch (e: any) {
      setErr(e.message || "Action failed");
    }
  };

  const createAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fCat || !fAddr) { setErr("Fill Name, Category, and Address"); return; }
    setCreatingAcc(true);
    setErr(null);
    try {
      await j(await fetch(`${API}/accessories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fName,
          categoryId: Number(fCat),
          controlType: fType,
          address: fAddr,
          isActive: fActive,
          timedMs: fTimedMs === "" ? null : Number(fTimedMs),
        }),
      }));
      setFName(""); setFCat(""); setFType("onOff"); setFAddr(""); setFActive(true); setFTimedMs("");
      setOffset(0);
      await loadAccs();
      setToast("Accessory created");
    } catch (e: any) {
      setErr(e.message || "Create failed");
    } finally {
      setCreatingAcc(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) { setErr("Category name is required"); return; }
    setCreatingCat(true);
    setErr(null);
    try {
      await j(await fetch(`${API}/categories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: cName.trim(),
          description: cDesc.trim() || null,
          sortOrder: cSort === "" ? 0 : Number(cSort),
        }),
      }));
      setCName(""); setCDesc(""); setCSort("");
      await loadCats();
      setToast("Category created");
    } catch (e: any) {
      setErr(e.message || "Create category failed");
    } finally {
      setCreatingCat(false);
    }
  };

  const deleteAccessory = async (id: number) => {
    if (!confirm("Delete this accessory?")) return;
    setErr(null);
    try {
      await j(await fetch(`${API}/accessories/${id}`, { method: "DELETE" }));
      await loadAccs();
      setToast("Accessory deleted");
    } catch (e: any) {
      setErr(e.message || "Delete failed");
    }
  };

  /* ---- UI ---- */
  return (
    <>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
            <Paper sx={{ p: 2, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom>
                Categories
              </Typography>

              <Button
                onClick={() => setSelCat("all")}
                variant={selCat === "all" ? "contained" : "outlined"}
                fullWidth
                sx={{ mb: 1, justifyContent: 'space-between' }}
              >
                <span>All</span>
                <span style={{ opacity: 0.7 }}>{totalAll}</span>
              </Button>

              {cats
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
                .map((c) => (
                  <Button
                    key={c.id}
                    onClick={() => setSelCat(c.id)}
                    variant={selCat === c.id ? "contained" : "outlined"}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    {c.name}
                  </Button>
                ))}

              <EntityForm
                title="New Category"
                onSubmit={createCategory}
                loading={creatingCat}
                fields={[
                  {
                    name: "cName",
                    label: "Name",
                    value: cName,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCName(e.target.value),
                  },
                  {
                    name: "cDesc",
                    label: "Description (optional)",
                    value: cDesc,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCDesc(e.target.value),
                  },
                  {
                    name: "cSort",
                    label: "Sort order",
                    type: "number",
                    value: cSort,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCSort(e.target.value === "" ? "" : Number(e.target.value)),
                  },
                ]}
              />

              <EntityForm
                title="New Accessory"
                onSubmit={createAccessory}
                loading={creatingAcc}
                fields={[
                  {
                    name: "fName",
                    label: "Name",
                    value: fName,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFName(e.target.value),
                  },
                  {
                    name: "fCat",
                    label: "Category",
                    type: "select",
                    value: fCat,
                    onChange: (e: React.ChangeEvent<{ value: unknown }>) => setFCat(e.target.value ? Number(e.target.value) : ""),
                    options: [
                      { value: "", label: "Select Category..." },
                      ...cats.map((c) => ({ value: c.id, label: c.name })),
                    ],
                  },
                  {
                    name: "fType",
                    label: "Type",
                    type: "select",
                    value: fType,
                    onChange: (e: React.ChangeEvent<{ value: unknown }>) => setFType(e.target.value as any),
                    options: [
                      { value: "onOff", label: "onOff" },
                      { value: "toggle", label: "toggle" },
                      { value: "timed", label: "timed" },
                    ],
                  },
                  {
                    name: "fAddr",
                    label: "Address",
                    value: fAddr,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFAddr(e.target.value),
                  },
                  {
                    name: "fActive",
                    label: "Active",
                    type: "checkbox",
                    value: fActive,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFActive(e.target.checked),
                  },
                  {
                    name: "fTimedMs",
                    label: "Timed ms (optional)",
                    type: "number",
                    value: fTimedMs,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFTimedMs(e.target.value === "" ? "" : Number(e.target.value)),
                  },
                ]}
              />
            </Paper>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
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
                  variant="outlined"
                  size="small"
                >
                  ‹ Prev
                </Button>
                <Button
                  disabled={accs.length < limit}
                  onClick={() => setOffset(offset + limit)}
                  variant="outlined"
                  size="small"
                >
                  Next ›
                </Button>
              </Box>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {err && (
                <Alert severity="error" sx={{ mb: 2 }}>
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
                      <TableCell>Active</TableCell>
                      <TableCell>Timed ms</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accs.map((a) => {
                      const editing = editId === a.id;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            {editing ? (
                              <TextField
                                value={eaName}
                                onChange={(e) => setEaName(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            ) : (
                              a.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editing ? (
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={eaCat}
                                  onChange={(e) => setEaCat(e.target.value ? Number(e.target.value) : "")}
                                  displayEmpty
                                >
                                  <MenuItem value="">
                                    <em>Category…</em>
                                  </MenuItem>
                                  {cats.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                      {c.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              a.category?.name ?? a.categoryId
                            )}
                          </TableCell>
                          <TableCell>
                            {editing ? (
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={eaType}
                                  onChange={(e) => setEaType(e.target.value as any)}
                                >
                                  <MenuItem value="onOff">onOff</MenuItem>
                                  <MenuItem value="toggle">toggle</MenuItem>
                                  <MenuItem value="timed">timed</MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              a.controlType
                            )}
                          </TableCell>
                          <TableCell>
                            {editing ? (
                              <TextField
                                value={eaAddr}
                                onChange={(e) => setEaAddr(e.target.value)}
                                size="small"
                                fullWidth
                              />
                            ) : (
                              a.address
                            )}
                          </TableCell>
                          <TableCell>
                            {editing ? (
                              <Checkbox
                                checked={eaActive}
                                onChange={(e) => setEaActive(e.target.checked)}
                              />
                            ) : (
                              a.isActive ? "Yes" : "No"
                            )}
                          </TableCell>
                          <TableCell>
                            {editing ? (
                              <TextField
                                type="number"
                                value={eaTimedMs}
                                onChange={(e) => setEaTimedMs(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="(optional)"
                                size="small"
                                fullWidth
                              />
                            ) : (
                              a.timedMs ?? "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {editing ? (
                                <>
                                  <Button
                                    onClick={(e) => saveAccessory(e, a.id)}
                                    disabled={savingAcc}
                                    variant="contained"
                                    size="small"
                                  >
                                    {savingAcc ? "Saving…" : "Save"}
                                  </Button>
                                  <Button
                                    onClick={cancelEdit}
                                    variant="outlined"
                                    size="small"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => act(a.id, "on", undefined, "ON")}
                                    disabled={!a.isActive}
                                    variant="contained"
                                    color="success"
                                    size="small"
                                  >
                                    On
                                  </Button>
                                  <Button
                                    onClick={() => act(a.id, "off", undefined, "OFF")}
                                    disabled={!a.isActive}
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                  >
                                    Off
                                  </Button>
                                  <Button
                                    onClick={() => act(a.id, "apply", undefined, "Applied")}
                                    disabled={!a.isActive}
                                    variant="outlined"
                                    size="small"
                                  >
                                    Apply
                                  </Button>
                                  <Button
                                    onClick={() => act(a.id, "apply", { milliseconds: 2000 }, "2s Applied")}
                                    disabled={!a.isActive}
                                    variant="outlined"
                                    size="small"
                                  >
                                    Apply 2s
                                  </Button>
                                  <Button
                                    onClick={() => beginEdit(a)}
                                    variant="outlined"
                                    size="small"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => deleteAccessory(a.id)}
                                    variant="contained"
                                    color="error"
                                    size="small"
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {accs.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No accessories
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
    </>
  );
}