import { useEffect, useMemo, useState } from "react";

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

type VersionInfo = { commit: string; built_at: string };

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

  const [ver, setVer] = useState<VersionInfo | null>(null);
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
    fetch(`${API}/version`).then(r => r.ok ? r.json() : Promise.reject()).then(setVer).catch(() => setVer(null));
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui" }}>
      <header style={{ padding: "12px 16px", background: "#003366", color: "#fff", fontSize: 20, fontWeight: 600 }}>
        🚂 Train Station
      </header>

      <main style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, padding: 16 }}>
        {/* Sidebar */}
        <aside style={{ borderRight: "1px solid #ddd", paddingRight: 16 }}>
          <h2 style={{ margin: "8px 0" }}>Categories</h2>

          <button
            onClick={() => setSelCat("all")}
            style={{ display: "block", width: "100%", textAlign: "left", padding: 8, marginBottom: 4,
                     background: selCat === "all" ? "#eef" : "#f7f7f7", border: "1px solid #ddd", borderRadius: 8 }}>
            All <span style={{ float: "right", opacity: 0.7 }}>{totalAll}</span>
          </button>

          {cats
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setSelCat(c.id)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: 8, marginBottom: 4,
                         background: selCat === c.id ? "#eef" : "#f7f7f7", border: "1px solid #ddd", borderRadius: 8 }}>
                {c.name}
              </button>
            ))}

          {/* New Category */}
          <h3 style={{ marginTop: 20, marginBottom: 8, fontSize: 16 }}>New Category</h3>
          <form onSubmit={createCategory} style={{ display: "grid", gap: 8 }}>
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Name"
                   style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }} />
            <input value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Description (optional)"
                   style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }} />
            <input type="number" value={cSort}
                   onChange={(e) => setCSort(e.target.value === "" ? "" : Number(e.target.value))}
                   placeholder="Sort order"
                   style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }} />
            <button disabled={creatingCat} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}>
              {creatingCat ? "Creating…" : "Create"}
            </button>
          </form>

          {/* New Accessory */}
          <h3 style={{ marginTop: 20, marginBottom: 8, fontSize: 16 }}>New Accessory</h3>
          <form onSubmit={createAccessory} style={{ display: "grid", gap: 8 }}>
            <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Name"
                   style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }} />
            <select value={fCat} onChange={(e) => setFCat(e.target.value ? Number(e.target.value) : "")}
                    style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }}>
              <option value="">Category…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={fType} onChange={(e) => setFType(e.target.value as any)}
                    style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }}>
              <option value="onOff">onOff</option>
              <option value="toggle">toggle</option>
              <option value="timed">timed</option>
            </select>
            <input value={fAddr} onChange={(e) => setFAddr(e.target.value)} placeholder="Address"
                   style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={fActive} onChange={(e) => setFActive(e.target.checked)} /> Active
            </label>
            <input type="number" value={fTimedMs}
                   onChange={(e) => setFTimedMs(e.target.value === "" ? "" : Number(e.target.value))}
                   placeholder="Timed ms (optional)"
                   style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }} />
            <button disabled={creatingAcc} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}>
              {creatingAcc ? "Creating…" : "Create"}
            </button>
          </form>
        </aside>

        {/* Content */}
        <section>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accessories…"
                   style={{ flex: 1, padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8 }} />
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> Active only
            </label>
            <span style={{ marginLeft: "auto" }}>
              <label style={{ marginRight: 6 }}>
                Page size:
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
                        style={{ marginLeft: 6 }}>
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>‹ Prev</button>
              <button disabled={accs.length < limit} onClick={() => setOffset(offset + limit)} style={{ marginLeft: 6 }}>
                Next ›
              </button>
            </span>
          </div>

          {loading && <div>Loading…</div>}
          {err && <div style={{ color: "#b00", marginBottom: 8 }}>Error: {err}</div>}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: 8 }}>Name</th>
                <th style={{ padding: 8 }}>Category</th>
                <th style={{ padding: 8 }}>Type</th>
                <th style={{ padding: 8 }}>Address</th>
                <th style={{ padding: 8 }}>Active</th>
                <th style={{ padding: 8 }}>Timed ms</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accs.map((a) => {
                const editing = editId === a.id;
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: 8 }}>
                      {editing ? (
                        <input value={eaName} onChange={(e) => setEaName(e.target.value)}
                               style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }} />
                      ) : a.name}
                    </td>
                    <td style={{ padding: 8 }}>
                      {editing ? (
                        <select value={eaCat} onChange={(e) => setEaCat(e.target.value ? Number(e.target.value) : "")}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
                          <option value="">Category…</option>
                          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (a.category?.name ?? a.categoryId)}
                    </td>
                    <td style={{ padding: 8 }}>
                      {editing ? (
                        <select value={eaType} onChange={(e) => setEaType(e.target.value as any)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
                          <option value="onOff">onOff</option>
                          <option value="toggle">toggle</option>
                          <option value="timed">timed</option>
                        </select>
                      ) : a.controlType}
                    </td>
                    <td style={{ padding: 8 }}>
                      {editing ? (
                        <input value={eaAddr} onChange={(e) => setEaAddr(e.target.value)}
                               style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }} />
                      ) : a.address}
                    </td>
                    <td style={{ padding: 8 }}>
                      {editing ? (
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <input type="checkbox" checked={eaActive} onChange={(e) => setEaActive(e.target.checked)} /> Active
                        </label>
                      ) : (a.isActive ? "Yes" : "No")}
                    </td>
                    <td style={{ padding: 8 }}>
                      {editing ? (
                        <input type="number" value={eaTimedMs}
                               onChange={(e) => setEaTimedMs(e.target.value === "" ? "" : Number(e.target.value))}
                               placeholder="(optional)"
                               style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }} />
                      ) : (a.timedMs ?? "—")}
                    </td>
                    <td style={{ padding: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {editing ? (
                        <>
                          <button onClick={(e) => saveAccessory(e, a.id)} disabled={savingAcc}>
                            {savingAcc ? "Saving…" : "Save"}
                          </button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => act(a.id, "on", undefined, "ON")} disabled={!a.isActive}>On</button>
                          <button onClick={() => act(a.id, "off", undefined, "OFF")} disabled={!a.isActive}>Off</button>
                          <button onClick={() => act(a.id, "apply", undefined, "Applied")} disabled={!a.isActive}>
                            Apply
                          </button>
                          <button onClick={() => act(a.id, "apply", { milliseconds: 2000 }, "2s Applied")} disabled={!a.isActive}>
                            Apply 2s
                          </button>
                          <button onClick={() => beginEdit(a)}>Edit</button>
                          <button onClick={() => deleteAccessory(a.id)}
                                  style={{ background: "#fee", border: "1px solid #f99", color: "#900" }}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {accs.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ padding: 20, color: "#777" }}>No accessories</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      <footer style={{ padding: "8px 16px", background: "#f7f7f7", borderTop: "1px solid #ddd", fontSize: 12, color: "#555" }}>
        Version {ver?.commit || "dev"} {ver?.built_at && `(deployed ${ver.built_at})`}
      </footer>

      {toast && (
        <div style={{
          position: "fixed", right: 16, bottom: 16, padding: "10px 14px",
          background: "#003366", color: "#fff", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.2)"
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}