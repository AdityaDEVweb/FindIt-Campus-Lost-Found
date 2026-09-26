import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search, Plus, Heart, MapPin, CalendarDays, Camera, Package,
  User, Bookmark, BookmarkCheck, ArrowLeft, CheckCircle2, X,
  SlidersHorizontal, Sparkles, ShieldCheck, ChevronRight, Trash2,
  Image as ImageIcon, Inbox, Menu
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "findit-items-v1";
const SAVED_KEY = "findit-saved-v1";
const USER_KEY = "findit-user-v1";

const seedItems = [];

const categories = ["All", "Electronics", "Documents", "Clothing", "Personal Items", "Books", "Accessories", "Other"];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function App() {
  const [items, setItems] = useState(() => load(STORAGE_KEY, seedItems).filter(item => !String(item.id).startsWith("seed-")));
  const [saved, setSaved] = useState(() => load(SAVED_KEY, []));
  const [user, setUser] = useState(() => load(USER_KEY, { name: "You", email: "you@campus.edu" }));
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem(SAVED_KEY, JSON.stringify(saved)), [saved]);
  useEffect(() => localStorage.setItem(USER_KEY, JSON.stringify(user)), [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      const textMatch = !q || [item.title, item.description, item.location, item.category]
        .join(" ").toLowerCase().includes(q);
      const catMatch = category === "All" || item.category === category;
      const typeMatch = typeFilter === "all" || item.type === typeFilter;
      return textMatch && catMatch && typeMatch && item.status !== "resolved";
    });
  }, [items, query, category, typeFilter]);

  const myItems = items.filter(i => i.owner === user.name && !i.id.startsWith("seed-"));

  const go = (p) => { setSelected(null); setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openItem = (item) => { setSelected(item); setPage("detail"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleSaved = (id) => setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const showToast = (msg) => setToast(msg);

  const createPost = (data) => {
    const item = {
      ...data, id: `user-${Date.now()}`, owner: user.name, status: "open",
      createdAt: new Date().toISOString()
    };
    setItems(prev => [item, ...prev]);
    showToast("Your post is live.");
    go("my-posts");
  };

  const submitClaim = (item) => {
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, claimBy: user.name, claimStatus: "pending" } : x));
    showToast("Claim submitted. The poster will review it.");
    setSelected(prev => prev ? { ...prev, claimBy: user.name, claimStatus: "pending" } : prev);
  };

  const deletePost = (id) => {
    setItems(prev => prev.filter(x => x.id !== id));
    showToast("Post deleted.");
  };

  return (
    <div className="app">
      <Header page={page} go={go} user={user} />

      {page === "home" && (
        <Home
          items={filteredItems}
          query={query} setQuery={setQuery}
          category={category} setCategory={setCategory}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          showFilters={showFilters} setShowFilters={setShowFilters}
          openItem={openItem} toggleSaved={toggleSaved} saved={saved}
          go={go}
        />
      )}

      {page === "browse" && (
        <Browse
          items={filteredItems}
          query={query} setQuery={setQuery}
          category={category} setCategory={setCategory}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          showFilters={showFilters} setShowFilters={setShowFilters}
          openItem={openItem} toggleSaved={toggleSaved} saved={saved}
        />
      )}

      {page === "post" && <PostForm onSubmit={createPost} go={go} />}

      {page === "detail" && selected && (
        <Detail item={selected} saved={saved.includes(selected.id)}
          toggleSaved={toggleSaved} submitClaim={submitClaim}
          go={go} user={user} />
      )}

      {page === "saved" && (
        <Saved items={items.filter(i => saved.includes(i.id))}
          openItem={openItem} toggleSaved={toggleSaved} />
      )}

      {page === "my-posts" && (
        <MyPosts items={myItems} openItem={openItem} deletePost={deletePost} go={go} />
      )}

      {page === "profile" && <Profile user={user} setUser={setUser} myItems={myItems} go={go} />}

      {toast && <div className="toast"><CheckCircle2 size={18} /> {toast}</div>}
      <Footer />
    </div>
  );
}

function Header({ page, go, user }) {
  return (
    <header className="header">
      <div className="header-inner">
        <button className="brand" onClick={() => go("home")}>
          <span className="brand-mark"><Package size={21}/></span>
          <span>Find<span className="brand-accent">It</span></span>
        </button>
        <nav className="nav">
          <button className={page === "home" ? "active" : ""} onClick={() => go("home")}>Home</button>
          <button className={page === "browse" ? "active" : ""} onClick={() => go("browse")}>Browse</button>
          <button className={page === "saved" ? "active" : ""} onClick={() => go("saved")}>Saved</button>
          <button className={page === "my-posts" ? "active" : ""} onClick={() => go("my-posts")}>My Posts</button>
          <button className={page === "post" ? "active report-nav" : "report-nav"} onClick={() => go("post")}><Plus size={15}/> Report Item</button>
        </nav>
        <button className="profile-pill" onClick={() => go("profile")}>
          <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
          <span className="desktop-only">{user.name}</span>
        </button>
      </div>
    </header>
  );
}

function Home({ items, query, setQuery, category, setCategory, typeFilter, setTypeFilter, showFilters, setShowFilters, openItem, toggleSaved, saved, go }) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><Sparkles size={15}/> CAMPUS LOST & FOUND</div>
          <h1>Lost something?<br/><span>Let’s find it.</span></h1>
          <p>One place for students to report, discover, and reunite with the things that matter.</p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => go("post")}><Plus size={18}/> Report an item</button>
            <button className="btn ghost-light" onClick={() => go("browse")}>Browse items <ChevronRight size={17}/></button>
          </div>
        </div>
        <div className="hero-art">
          <div className="float-card card-a"><span>🎧</span><div><b>AirPods</b><small>Student Center</small></div></div>
          <div className="float-card card-b"><span>🎒</span><div><b>Backpack</b><small>Library</small></div></div>
          <div className="hero-circle"><Package size={88} strokeWidth={1.2}/></div>
        </div>
      </section>

      <main className="container">
        <div className="section-head">
          <div>
            <p className="section-kicker">DISCOVER</p>
            <h2>Recently reported</h2>
          </div>
          <button className="text-btn" onClick={() => go("browse")}>View all <ChevronRight size={16}/></button>
        </div>
        <SearchBar query={query} setQuery={setQuery} setShowFilters={setShowFilters} />
        {showFilters && <FilterBar category={category} setCategory={setCategory} typeFilter={typeFilter} setTypeFilter={setTypeFilter}/>}
        <div className="mini-tabs">
          <button className={typeFilter === "all" ? "selected" : ""} onClick={() => setTypeFilter("all")}>All items</button>
          <button className={typeFilter === "lost" ? "selected" : ""} onClick={() => setTypeFilter("lost")}>Lost</button>
          <button className={typeFilter === "found" ? "selected" : ""} onClick={() => setTypeFilter("found")}>Found</button>
        </div>
        <ItemGrid items={items.slice(0, 6)} openItem={openItem} toggleSaved={toggleSaved} saved={saved}/>
      </main>
    </>
  );
}

function Browse({ items, query, setQuery, category, setCategory, typeFilter, setTypeFilter, showFilters, setShowFilters, openItem, toggleSaved, saved }) {
  return (
    <main className="container page-pad">
      <div className="page-title">
        <div><p className="section-kicker">EXPLORE</p><h1>Browse items</h1><p>Search the campus listings and narrow them down with filters.</p></div>
        <div className="stat-chip"><Package size={17}/>{items.length} active listings</div>
      </div>
      <SearchBar query={query} setQuery={setQuery} setShowFilters={setShowFilters}/>
      {showFilters && <FilterBar category={category} setCategory={setCategory} typeFilter={typeFilter} setTypeFilter={setTypeFilter}/>}
      <ItemGrid items={items} openItem={openItem} toggleSaved={toggleSaved} saved={saved}/>
      {items.length === 0 && <EmptyState title="No matching items" text="Try a different search term or remove a filter."/>}
    </main>
  );
}

function SearchBar({ query, setQuery, setShowFilters }) {
  return <div className="search-row">
    <div className="search-box"><Search size={20}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by item, location, or description..." /></div>
    <button className="filter-btn" onClick={() => setShowFilters(v => !v)}><SlidersHorizontal size={18}/> Filters</button>
  </div>;
}

function FilterBar({ category, setCategory, typeFilter, setTypeFilter }) {
  return <div className="filter-panel">
    <div><label>Category</label><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
    <div><label>Type</label><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">All</option><option value="lost">Lost</option><option value="found">Found</option></select></div>
  </div>;
}

function ItemGrid({ items, openItem, toggleSaved, saved }) {
  return <div className="grid">{items.map(item => <ItemCard key={item.id} item={item} openItem={openItem} toggleSaved={toggleSaved} saved={saved.includes(item.id)}/>)}</div>;
}

function ItemCard({ item, openItem, toggleSaved, saved }) {
  return <article className="item-card" onClick={() => openItem(item)}>
    <div className="item-image">
      <img src={item.image} alt={item.title} />
      <span className={`type-badge ${item.type}`}>{item.type === "lost" ? "Lost" : "Found"}</span>
      <button className="save-btn" onClick={e => { e.stopPropagation(); toggleSaved(item.id); }}>{saved ? <BookmarkCheck size={18}/> : <Bookmark size={18}/>}</button>
    </div>
    <div className="item-body">
      <div className="item-category">{item.category}</div>
      <h3>{item.title}</h3>
      <p className="item-desc">{item.description}</p>
      <div className="item-meta"><span><MapPin size={14}/>{item.location}</span><span><CalendarDays size={14}/>{formatDate(item.date)}</span></div>
    </div>
  </article>;
}

function Detail({ item, saved, toggleSaved, submitClaim, go, user }) {
  const isMine = item.owner === user.name;
  return <main className="container page-pad">
    <button className="back-btn" onClick={() => go("browse")}><ArrowLeft size={17}/> Back to listings</button>
    <div className="detail">
      <div className="detail-image"><img src={item.image} alt={item.title}/><span className={`type-badge large ${item.type}`}>{item.type === "lost" ? "Lost item" : "Found item"}</span></div>
      <div className="detail-content">
        <div className="item-category">{item.category}</div>
        <h1>{item.title}</h1>
        <p className="detail-description">{item.description}</p>
        <div className="detail-facts">
          <div><MapPin/><span><small>Location</small><b>{item.location}</b></span></div>
          <div><CalendarDays/><span><small>Date reported</small><b>{formatDate(item.date)}</b></span></div>
          <div><User/><span><small>Posted by</small><b>{item.owner}</b></span></div>
        </div>
        <div className="ai-match"><Sparkles size={20}/><div><b>AI matching coming next</b><p>Future versions can compare this photo and description against other listings to surface likely matches automatically.</p></div></div>
        <div className="detail-actions">
          {!isMine && item.type === "found" && !item.claimStatus && <button className="btn primary wide" onClick={() => submitClaim(item)}>This is mine — submit a claim</button>}
          {!isMine && item.claimStatus === "pending" && <button className="btn disabled wide" disabled><CheckCircle2 size={18}/> Claim submitted</button>}
          <button className="btn outline wide" onClick={() => toggleSaved(item.id)}>{saved ? <BookmarkCheck size={18}/> : <Bookmark size={18}/>} {saved ? "Saved" : "Save item"}</button>
        </div>
        <div className="safety-note"><ShieldCheck size={17}/><span>For safety, verify identifying details before handing over an item. Meet in a public campus location.</span></div>
      </div>
    </div>
  </main>;
}

function PostForm({ onSubmit, go }) {
  const [form, setForm] = useState({ type:"lost", title:"", category:"Electronics", location:"", date:new Date().toISOString().slice(0,10), description:"", image:"" });
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState("");

  const update = (key, val) => setForm(f => ({...f, [key]:val}));

  const recognizeWithAI = async () => {
    if (!form.image) { setError("Add a photo first so AI can recognize the item."); return; }
    setAiLoading(true);
    setAiNote("");
    setError("");
    try {
      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: form.image })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI recognition failed.");
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        category: categories.includes(data.category) ? data.category : f.category,
        description: data.description || f.description
      }));
      setAiNote(data.note || "AI filled the item details from the photo. Please verify them before publishing.");
    } catch (err) {
      setError(err.message || "Could not recognize the image.");
    } finally {
      setAiLoading(false);
    }
  };
  const file = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { setError("Please choose an image smaller than 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setPreview(reader.result); update("image", reader.result); };
    reader.readAsDataURL(f);
  };
  const submit = e => {
    e.preventDefault();
    if (!form.title || !form.location || !form.description || !form.image) { setError("Please complete all fields and add a photo."); return; }
    setError(""); onSubmit(form);
  };

  return <main className="container page-pad narrow">
    <button className="back-btn" onClick={() => go("home")}><ArrowLeft size={17}/> Cancel</button>
    <div className="form-heading"><p className="section-kicker">CREATE LISTING</p><h1>Report an item</h1><p>Give the campus community enough detail to help reunite an item with its owner.</p></div>
    <form className="post-form" onSubmit={submit}>
      <div className="type-toggle"><button type="button" className={form.type==="lost"?"on":""} onClick={()=>update("type","lost")}>I lost something</button><button type="button" className={form.type==="found"?"on":""} onClick={()=>update("type","found")}>I found something</button></div>
      <div className="upload">
        {preview ? <img src={preview} alt="Preview"/> : <><Camera size={30}/><b>Add a photo</b><span>JPG, PNG up to 4MB</span></>}
        <input type="file" accept="image/*" onChange={file}/>
      </div>
      {preview && (
        <div className="ai-recognition">
          <div className="ai-recognition-copy">
            <div className="ai-icon"><Sparkles size={17}/></div>
            <div><b>AI item recognition</b><p>Let Gemini identify the item and suggest a category and description.</p></div>
          </div>
          <button type="button" className="btn ai-btn" onClick={recognizeWithAI} disabled={aiLoading}>
            <Sparkles size={17}/> {aiLoading ? "Recognizing..." : "Recognize with AI"}
          </button>
          {aiNote && <div className="ai-note">{aiNote}</div>}
        </div>
      )}
      <div className="form-grid">
        <Field label="Item name" required><input value={form.title} onChange={e=>update("title",e.target.value)} placeholder="e.g. Black AirPods Pro"/></Field>
        <Field label="Category"><select value={form.category} onChange={e=>update("category",e.target.value)}>{categories.filter(x=>x!=="All").map(c=><option key={c}>{c}</option>)}</select></Field>
        <Field label="Where?" required><input value={form.location} onChange={e=>update("location",e.target.value)} placeholder="e.g. Main Library"/></Field>
        <Field label="Date"><input type="date" value={form.date} onChange={e=>update("date",e.target.value)}/></Field>
      </div>
      <Field label="Description" required><textarea value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Add identifying details, color, brand, where exactly it was seen, etc." rows="5"/></Field>
      {error && <div className="error"><X size={16}/>{error}</div>}
      <button className="btn primary wide" type="submit"><Plus size={18}/> Publish listing</button>
    </form>
  </main>;
}

function Field({label, required, children}) { return <label className="field"><span>{label}{required && " *"}</span>{children}</label>; }

function Saved({ items, openItem, toggleSaved }) {
  return <main className="container page-pad">
    <div className="page-title"><div><p className="section-kicker">YOUR LIST</p><h1>Saved items</h1><p>Keep an eye on listings you may want to revisit.</p></div><div className="stat-chip"><Bookmark size={17}/>{items.length} saved</div></div>
    {items.length ? <ItemGrid items={items} openItem={openItem} toggleSaved={toggleSaved} saved={items.map(i=>i.id)}/> : <EmptyState title="Nothing saved yet" text="Tap the bookmark on any listing to save it here."/>}
  </main>;
}

function MyPosts({items, openItem, deletePost, go}) {
  return <main className="container page-pad">
    <div className="page-title"><div><p className="section-kicker">YOUR ACTIVITY</p><h1>My posts</h1><p>Manage listings you've created.</p></div><button className="btn primary" onClick={()=>go("post")}><Plus size={17}/> New post</button></div>
    {items.length ? <div className="my-list">{items.map(item=><div className="my-row" key={item.id} onClick={()=>openItem(item)}><img src={item.image} alt=""/><div className="my-row-info"><span className={`tiny-type ${item.type}`}>{item.type}</span><h3>{item.title}</h3><p>{item.location} · {formatDate(item.date)}</p></div><span className="status">Active</span><button className="icon-btn danger" onClick={e=>{e.stopPropagation();deletePost(item.id)}}><Trash2 size={17}/></button></div>)}</div> : <EmptyState title="You haven't posted anything" text="Create a lost or found listing to get started." action={()=>go("post")} actionText="Create a post"/>}
  </main>;
}

function Profile({user,setUser,myItems,go}) {
  const [name,setName] = useState(user.name), [email,setEmail] = useState(user.email);
  const save = () => { setUser({name:name||"You",email}); };
  return <main className="container page-pad narrow">
    <div className="profile-hero"><div className="big-avatar">{user.name.charAt(0).toUpperCase()}</div><div><p className="section-kicker">ACCOUNT</p><h1>Your profile</h1><p>Manage the identity shown on your FindIt posts.</p></div></div>
    <div className="profile-card">
      <Field label="Display name"><input value={name} onChange={e=>setName(e.target.value)}/></Field>
      <Field label="Campus email"><input value={email} onChange={e=>setEmail(e.target.value)}/></Field>
      <button className="btn primary" onClick={()=>{save();go("home")}}>Save changes</button>
    </div>
    <div className="profile-stats"><div><b>{myItems.length}</b><span>Your posts</span></div><div><b>Local</b><span>Storage mode</span></div><div><b>AI</b><span>Next-stage matching</span></div></div>
  </main>;
}

function EmptyState({title,text,action,actionText}) {
  return <div className="empty"><div className="empty-icon"><Inbox size={28}/></div><h3>{title}</h3><p>{text}</p>{action && <button className="btn primary" onClick={action}>{actionText}</button>}</div>;
}

function Footer() {
  return <footer><div className="footer-inner"><div className="brand"><span className="brand-mark"><Package size={17}/></span><span>Find<span className="brand-accent">It</span></span></div><p>Campus lost & found, made simpler.</p><span>Prototype · LocalStorage</span></div></footer>;
}

function formatDate(date) {
  try { return new Intl.DateTimeFormat("en", {month:"short", day:"numeric", year:"numeric"}).format(new Date(date+"T12:00:00")); } catch { return date; }
}

createRoot(document.getElementById("root")).render(<App />);
