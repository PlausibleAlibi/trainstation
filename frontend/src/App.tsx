import { useEffect, useMemo, useState } from "react";

type Category = { id: number; name: string; description?: string | null; sortOrder: number };
type AccessoryRead = {
  id: number;
  name: string;
  categoryId: number;
  controlType: "onOff" | "toggle" | "timed";
  address: string;
  isActive: boolean;
};
type AccessoryWithCategory = AccessoryRead & { category?: Category | null };

// Env
const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";
const APP_DEPLOYED = import.meta.env.VITE_APP_DEPLOYED || "";

// helper
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

export default function App() {
  const [cats, setCats] = useState<Category[]>([]);
  const [selCat, setSelCat] = useState<number | "all">("all");
  const [accs, setAccs] = useState<AccessoryWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // create form state
  const [fName, setFName] = useState("");
  const [fCat, setFCat] = useState<number | "">("");
  const [fType, setFType] = useState<"onOff" | "toggle" | "timed">("onOff");
  const [fAddr, setFAddr] = useState("");
  const [fActive, setFActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // data loaders
  const loadCats = async () => setCats(await j<Category[]>(await fetch(`${API}/categories`)));
  const loadAccs = async () => {
    const p = new URLSearchParams({ includeCategory: "true" });
    if (selCat !== "all") p.set("categoryId", String(selCat));
    if (q.trim()) p.set("q", q.trim());
    setLoading(true); setErr(null);
    try { setAccs(await j(await fetch(`${API}/accessories?${p.toString()}`))); }
    catch (e:any) { setErr(e.message || "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCats(); }, []);
  useEffect(() => { loadAccs(); /* eslint-disable-next-line */ }, [selCat]);

  const filtered = useMemo(() => accs, [accs]);

  // actions
  const act = async (id:number, kind:"on"|"off"|"apply", body?: any) => {
    const url = kind === "apply"
      ? `${API}/actions/accessories/${id}/apply`
      : `${API}/actions/accessories/${id}/${kind}`;
    setErr(null);
    try {
      await j(await fetch(url, { method: "POST", headers: body ? {"content-type":"application/json"}: undefined, body: body ? JSON.stringify(body) : undefined }));
    } catch(e:any){ setErr(e.message || "action failed"); }
  };

  // create accessory
  const createAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fCat || !fAddr) { setErr("Please fill Name, Category, Address"); return; }
    setCreating(true); setErr(null);
    try {
      await j(await fetch(`${API}/accessories`, {
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify({
          name: fName, categoryId: Number(fCat), controlType: fType,
          address: fAddr, isActive: fActive
        })
      }));
      setFName(""); setFCat(""); setFType("onOff"); setFAddr(""); setFActive(true);
      await loadAccs();
    } catch(e:any){ setErr(e.message || "create failed"); }
    finally{ setCreating(false); }
  };

  return (
    <div style={{display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"ui-sans-serif, system-ui"}}>
      {/* Header */}
      <header style={{padding:"12px 16px", background:"#003366", color:"#fff", fontSize:20, fontWeight:600}}>
        🚂 Train Station
      </header>

      {/* Main */}
      <main style={{flex:1, display:"grid", gridTemplateColumns:"300px 1fr", gap:16, padding:16}}>
        {/* Sidebar */}
        <aside style={{borderRight:"1px solid #ddd", paddingRight:16}}>
          <h2 style={{margin:"8px 0"}}>Categories</h2>
          <button
            onClick={()=>setSelCat("all")}
            style={{display:"block", width:"100%", textAlign:"left", padding:"8px", marginBottom:4,
                    background: selCat==="all"?"#eef":"#f7f7f7", border:"1px solid #ddd", borderRadius:8}}>
            All
          </button>
          {cats.sort((a,b)=> (a.sortOrder-b.sortOrder) || a.name.localeCompare(b.name)).map(c=>(
            <button key={c.id} onClick={()=>setSelCat(c.id)}
              style={{display:"block", width:"100%", textAlign:"left", padding:"8px", marginBottom:4,
                      background: selCat===c.id?"#eef":"#f7f7f7", border:"1px solid #ddd", borderRadius:8}}>
              {c.name}
            </button>
          ))}

          <h3 style={{marginTop:20, marginBottom:8, fontSize:16}}>New Accessory</h3>
          <form onSubmit={createAccessory} style={{display:"grid", gap:8}}>
            <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="Name"
                   style={{padding:"8px 10px", border:"1px solid #ccc", borderRadius:8}}/>
            <select value={fCat} onChange={e=>setFCat(e.target.value ? Number(e.target.value) : "")}
                    style={{padding:"8px 10px", border:"1px solid #ccc", borderRadius:8}}>
              <option value="">Category…</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={fType} onChange={e=>setFType(e.target.value as any)}
                    style={{padding:"8px 10px", border:"1px solid #ccc", borderRadius:8}}>
              <option value="onOff">onOff</option>
              <option value="toggle">toggle</option>
              <option value="timed">timed</option>
            </select>
            <input value={fAddr} onChange={e=>setFAddr(e.target.value)} placeholder="Address (e.g., relay-1)"
                   style={{padding:"8px 10px", border:"1px solid #ccc", borderRadius:8}}/>
            <label style={{display:"flex", alignItems:"center", gap:8}}>
              <input type="checkbox" checked={fActive} onChange={e=>setFActive(e.target.checked)} />
              Active
            </label>
            <button disabled={creating} style={{padding:"8px 10px", borderRadius:8, border:"1px solid #ccc"}}>
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
        </aside>

        {/* Content */}
        <section>
          <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:12}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search accessories…"
                   style={{flex:1, padding:"8px 10px", border:"1px solid #ccc", borderRadius:8}}/>
            <button onClick={loadAccs}
                    style={{padding:"8px 12px", border:"1px solid #ccc", borderRadius:8}}>Search</button>
          </div>

          {loading && <div>Loading…</div>}
          {err && <div style={{color:"#b00", marginBottom:8}}>Error: {err}</div>}

          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{textAlign:"left", borderBottom:"1px solid #ddd"}}>
                <th style={{padding:"8px"}}>Name</th>
                <th style={{padding:"8px"}}>Category</th>
                <th style={{padding:"8px"}}>Type</th>
                <th style={{padding:"8px"}}>Address</th>
                <th style={{padding:"8px"}}>Active</th>
                <th style={{padding:"8px"}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a=>(
                <tr key={a.id} style={{borderBottom:"1px solid #f0f0f0"}}>
                  <td style={{padding:"8px"}}>{a.name}</td>
                  <td style={{padding:"8px"}}>{a.category?.name ?? a.categoryId}</td>
                  <td style={{padding:"8px"}}>{a.controlType}</td>
                  <td style={{padding:"8px"}}>{a.address}</td>
                  <td style={{padding:"8px"}}>{a.isActive ? "Yes" : "No"}</td>
                  <td style={{padding:"8px", display:"flex", gap:6, flexWrap:"wrap"}}>
                    <button onClick={()=>act(a.id,"on")}  disabled={!a.isActive}>On</button>
                    <button onClick={()=>act(a.id,"off")} disabled={!a.isActive}>Off</button>
                    <button onClick={()=>act(a.id,"apply")} disabled={!a.isActive}>Apply</button>
                    {a.controlType==="onOff" && (
                      <>
                        <button onClick={()=>act(a.id,"apply",{state:"on"})}  disabled={!a.isActive}>Apply: ON</button>
                        <button onClick={()=>act(a.id,"apply",{state:"off"})} disabled={!a.isActive}>Apply: OFF</button>
                      </>
                    )}
                    {a.controlType==="timed" && (
                      <button onClick={()=>act(a.id,"apply",{milliseconds:2000})} disabled={!a.isActive}>Apply: 2s</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length===0 && !loading && (
                <tr><td colSpan={6} style={{padding:"20px", color:"#777"}}>No accessories</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {/* Footer */}
      <footer style={{padding:"8px 16px", background:"#f7f7f7", borderTop:"1px solid #ddd", fontSize:12, color:"#555"}}>
        Version {APP_VERSION} {APP_DEPLOYED && `(deployed ${APP_DEPLOYED})`}
      </footer>
    </div>
  );
}