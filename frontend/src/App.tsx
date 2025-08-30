import { useEffect, useMemo, useState } from "react";

/* ------------ Types ------------ */
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
};
type AccessoryWithCategory = AccessoryRead & { category?: Category | null };

/* ------------ Env ------------ */
const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const FALLBACK_VERSION = import.meta.env.VITE_APP_VERSION || "dev";
const FALLBACK_DEPLOYED = import.meta.env.VITE_APP_DEPLOYED || "";

/* ------------ Helpers ------------ */
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

/* ===========================================
   App
   =========================================== */
export default function App() {
  /* ---- Data ---- */
  const [cats, setCats] = useState<Category[]>([]);
  const [selCat, setSelCat] = useState<number | "all">("all");

  // Current page of accessories for filters
  const [accs, setAccs] = useState<AccessoryWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Global counts per category
  const [catCounts, setCatCounts] = useState<Map<number, number>>(new Map());

  // Pagination
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Footer version
  const [ver, setVer] = useState<{ commit: string; built_at: string } | null>(null);

  // Create Accessory form
  const [fName, setFName] = useState("");
  const [fCat, setFCat] = useState<number | "">("");
  const [fType, setFType] = useState<"onOff" | "toggle" | "timed">("onOff");
  const [fAddr, setFAddr] = useState("");
  const [fActive, setFActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create Category form
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cSort, setCSort] = useState<number | "">("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Edit Category form
  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eSort, setESort] = useState<number | "">("");
  const [savingCat, setSavingCat] = useState(false);

  /* ---- Loaders ---- */
  const loadCats = async () => {
    setCats(await j<Category[]>(await fetch(`${API}/categories`)));
  };

  const loadCatCounts = async () => {
    try {
      const stats: { categoryId: number; count: number }[] = await j(
        await fetch(`${API}/categories/stats`)
      );
      setCatCounts(new Map(stats.map((s) => [s.categoryId, s.count])));
    } catch (e: any) {
      console.warn("Failed to load category stats:", e?.message || e);
      setCatCounts(new Map());
    }
  };

  // Loads a paged set for current filters
  const loadAccs = async () => {
    const p = new URLSearchParams({
      includeCategory: "true",
      limit: String(limit),
      offset: String(offset),
    });
    if (selCat !== "all") p.set("categoryId", String(selCat));
    if (q.trim()) p.set("q", q.trim());

    setLoading(true);
    setErr(null);
    try {
      setAccs(
        await j<AccessoryWithCategory[]>(
          await fetch(`${API}/accessories?${p.toString()}`)
        )
      );
    } catch (e: any) {
      setErr(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Effects ---- */
  useEffect(() => {
    loadCats();
    loadCatCounts();
  }, []);

  useEffect(() => {
    loadAccs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selCat, limit, offset, q]);

  useEffect(() => {
    fetch(`${API}/version`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setVer)
      .catch(() => setVer(null));
  }, []);

  // Reset to first page when category changes
  useEffect(() => {
    setOffset(0);
  }, [selCat]);

  // Hydrate edit fields when the selected category changes
  useEffect(() => {
    if (typeof selCat === "number") {
      const c = cats.find((x) => x.id === selCat);
      if (c) {
        setEName(c.name);
        setEDesc(c.description ?? "");
        setESort(c.sortOrder ?? 0);
      }
    }
  }, [selCat, cats]);

  /* ---- Derived ---- */
  const totalAll = useMemo(
    () => Array.from(catCounts.values()).reduce((a, b) => a + b, 0),
    [catCounts]
  );

  /* ---- Actions ---- */
  const act = async (id: number, kind: "on" | "off" | "apply", body?: any) => {
    const url =
      kind === "apply"
        ? `${API}/actions/accessories/${id}/apply`
        : `${API}/actions/accessories/${id}/${kind}`;
    setErr(null);
    try {
      await j(
        await fetch(url, {
          method: "POST",
          headers: body ? { "content-type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        })
      );
    } catch (e: any) {
      setErr(e.message || "action failed");
    }
  };

  const createAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fCat || !fAddr) {
      setErr("Please fill Name, Category, and Address");
      return;
    }
    setCreating(true);
    setErr(null);
    try {
      await j(
        await fetch(`${API}/accessories`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: fName,
            categoryId: Number(fCat),
            controlType: fType,
            address: fAddr,
            isActive: fActive,
          }),
        })
      );
      setFName("");
      setFCat("");
      setFType("onOff");
      setFAddr("");
      setFActive(true);
      setOffset(0);
      await loadAccs();
      await loadCatCounts();
    } catch (e: any) {
      setErr(e.message || "create failed");
    } finally {
      setCreating(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) {
      setErr("Category name is required");
      return;
    }
    setCreatingCat(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/categories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: cName.trim(),
          description: cDesc.trim() || null,
          sortOrder: cSort === "" ? 0 : Number(cSort),
        }),
      });
      const created = await j<Category>(res);
      setCName("");
      setCDesc("");
      setCSort("");
      await loadCats();
      await loadCatCounts();
      setSelCat(created.id);
      setOffset(0);
      await loadAccs();
    } catch (e: any) {
      setErr(e.message || "Failed to create category");
    } finally {
      setCreatingCat(false);
    }
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof selCat !== "number") return;
    if (!eName.trim()) {
      setErr("Category name is required");
      return;
    }
    setSavingCat(true);
    setErr(null);
    try {
      await j(
        await fetch(`${API}/categories/${selCat}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: eName.trim(),
            description: eDesc.trim() || null,
            sortOrder: eSort === "" ? 0 : Number(eSort),
          }),
        })
      );
      await loadCats();
      await loadCatCounts(); // keep counts and order fresh
    } catch (e: any) {
      setErr(e.message || "Update category failed");
    } finally {
      setSavingCat(false);
    }
  };

  const deleteAccessory = async (id: number) => {
    if (!confirm("Delete this accessory?")) return;
    setErr(null);
    try {
      await j(await fetch(`${API}/accessories/${id}`, { method: "DELETE" }));
      await loadAccs();
      await loadCatCounts();
    } catch (e: any) {
      setErr(e.message || "Delete accessory failed");
    }
  };

  const deleteCurrentCategory = async () => {
    if (selCat === "all" || typeof selCat !== "number") return;
    if (!confirm("Delete this category? (Category must be empty)")) return;
    setErr(null);
    try {
      await j(await fetch(`${API}/categories/${selCat}`, { method: "DELETE" }));
      await loadCats();
      await loadCatCounts();
      setSelCat("all");
      setOffset(0);
      await loadAccs();
    } catch (e: any) {
      setErr(e.message || "Delete category failed (maybe it still has accessories?)");
    }
  };

  /* ---- Render ---- */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "12px 16px",
          background: "#003366",
          color: "#fff",
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        🚂 Train Station
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 16,
          padding: 16,
        }}
      >
        {/* Sidebar */}
        <aside style={{ borderRight: "1px solid #ddd", paddingRight: 16 }}>
          <h2 style={{ margin: "8px 0" }}>Categories</h2>

          <button
            onClick={() => setSelCat("all")}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px",
              marginBottom: 4,
              background: selCat === "all" ? "#eef" : "#f7f7f7",
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            All{" "}
            <span style={{ float: "right", opacity: 0.7 }}>{totalAll}</span>
          </button>

          {cats
            .sort(
              (a, b) =>
                a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
            )
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setSelCat(c.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px",
                  marginBottom: 4,
                  background: selCat === c.id ? "#eef" : "#f7f7f7",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                <span>{c.name}</span>
                <span style={{ float: "right", opacity: 0.7 }}>
                  {catCounts.get(c.id) ?? 0}
                </span>
              </button>
            ))}

          {typeof selCat === "number" && (
            <>
              <button
                onClick={deleteCurrentCategory}
                style={{
                  marginTop: 8,
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  padding: "8px",
                  background: "#fee",
                  border: "1px solid #f99",
                  borderRadius: 8,
                  color: "#900",
                }}
                title="Category must be empty"
              >
                Delete Selected Category
              </button>

              {/* Edit Category */}
              <h3 style={{ marginTop: 20, marginBottom: 8, fontSize: 16 }}>
                Edit Category
              </h3>
              <form onSubmit={saveCategory} style={{ display: "grid", gap: 8 }}>
                <input
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  placeholder="Name"
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                  }}
                />
                <input
                  value={eDesc}
                  onChange={(e) => setEDesc(e.target.value)}
                  placeholder="Description"
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                  }}
                />
                <input
                  type="number"
                  value={eSort}
                  onChange={(e) =>
                    setESort(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Sort order"
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                  }}
                />
                <button
                  disabled={savingCat}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                >
                  {savingCat ? "Saving…" : "Save Changes"}
                </button>
              </form>
            </>
          )}

          {/* New Category */}
          <h3 style={{ marginTop: 20, marginBottom: 8, fontSize: 16 }}>
            New Category
          </h3>
          <form onSubmit={createCategory} style={{ display: "grid", gap: 8 }}>
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Name"
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            />
            <input
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              placeholder="Description (optional)"
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            />
            <input
              type="number"
              value={cSort}
              onChange={(e) =>
                setCSort(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Sort order (default 0)"
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            />
            <button
              disabled={creatingCat}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            >
              {creatingCat ? "Creating…" : "Create Category"}
            </button>
          </form>

          {/* New Accessory */}
          <h3 style={{ marginTop: 20, marginBottom: 8, fontSize: 16 }}>
            New Accessory
          </h3>
          <form onSubmit={createAccessory} style={{ display: "grid", gap: 8 }}>
            <input
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder="Name"
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            />
            <select
              value={fCat}
              onChange={(e) =>
                setFCat(e.target.value ? Number(e.target.value) : "")
              }
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            >
              <option value="">Category…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={fType}
              onChange={(e) => setFType(e.target.value as any)}
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            >
              <option value="onOff">onOff</option>
              <option value="toggle">toggle</option>
              <option value="timed">timed</option>
            </select>
            <input
              value={fAddr}
              onChange={(e) => setFAddr(e.target.value)}
              placeholder="Address (e.g., relay-1)"
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={fActive}
                onChange={(e) => setFActive(e.target.checked)}
              />{" "}
              Active
            </label>
            <button
              disabled={creating}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            >
              {creating ? "Creating…" : "Create Accessory"}
            </button>
          </form>
        </aside>

        {/* Content */}
        <section>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search accessories…"
              style={{
                flex: 1,
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            />
            <button
              onClick={() => {
                setOffset(0);
                loadAccs();
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            >
              Search
            </button>

            <span style={{ marginLeft: "auto" }}>
              <label style={{ marginRight: 6 }}>
                Page size:
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setOffset(0);
                  }}
                  style={{ marginLeft: 6 }}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                ‹ Prev
              </button>
              <button
                disabled={accs.length < limit}
                onClick={() => setOffset(offset + limit)}
                style={{ marginLeft: 6 }}
              >
                Next ›
              </button>
            </span>
          </div>

          {loading && <div>Loading…</div>}
          {err && (
            <div style={{ color: "#b00", marginBottom: 8 }}>Error: {err}</div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "8px" }}>Name</th>
                <th style={{ padding: "8px" }}>Category</th>
                <th style={{ padding: "8px" }}>Type</th>
                <th style={{ padding: "8px" }}>Address</th>
                <th style={{ padding: "8px" }}>Active</th>
                <th style={{ padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accs.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px" }}>{a.name}</td>
                  <td style={{ padding: "8px" }}>
                    {a.category?.name ?? a.categoryId}
                  </td>
                  <td style={{ padding: "8px" }}>{a.controlType}</td>
                  <td style={{ padding: "8px" }}>{a.address}</td>
                  <td style={{ padding: "8px" }}>{a.isActive ? "Yes" : "No"}</td>
                  <td
                    style={{
                      padding: "8px",
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => act(a.id, "on")}
                      disabled={!a.isActive}
                    >
                      On
                    </button>
                    <button
                      onClick={() => act(a.id, "off")}
                      disabled={!a.isActive}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => act(a.id, "apply")}
                      disabled={!a.isActive}
                    >
                      Apply
                    </button>
                    {a.controlType === "onOff" && (
                      <>
                        <button
                          onClick={() => act(a.id, "apply", { state: "on" })}
                          disabled={!a.isActive}
                        >
                          Apply: ON
                        </button>
                        <button
                          onClick={() => act(a.id, "apply", { state: "off" })}
                          disabled={!a.isActive}
                        >
                          Apply: OFF
                        </button>
                      </>
                    )}
                    {a.controlType === "timed" && (
                      <button
                        onClick={() =>
                          act(a.id, "apply", { milliseconds: 2000 })
                        }
                        disabled={!a.isActive}
                      >
                        Apply: 2s
                      </button>
                    )}
                    <button
                      onClick={() => deleteAccessory(a.id)}
                      style={{
                        background: "#fee",
                        border: "1px solid #f99",
                        color: "#900",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {accs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: "20px", color: "#777" }}>
                    No accessories
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "8px 16px",
          background: "#f7f7f7",
          borderTop: "1px solid #ddd",
          fontSize: 12,
          color: "#555",
        }}
      >
        Version {ver?.commit || FALLBACK_VERSION}{" "}
        {(ver?.built_at || FALLBACK_DEPLOYED) &&
          `(deployed ${ver?.built_at || FALLBACK_DEPLOYED})`}
      </footer>
    </div>
  );
}