import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search, Plus, MapPin, CalendarDays, Camera, Package, User,
  Bookmark, BookmarkCheck, ArrowLeft, CheckCircle2, X, SlidersHorizontal,
  Sparkles, ShieldCheck, ChevronRight, Trash2, Inbox, Clock3,
  RotateCcw
} from "lucide-react";
import "./styles.css";
import "./findit-enhancements.css";

const STORAGE_KEY = "findit-items-v2";
const SAVED_KEY = "findit-saved-v1";
const USER_KEY = "findit-user-v1";

const seedItems = [];

const categories = [
  "All",
  "Electronics",
  "Documents",
  "Clothing",
  "Personal Items",
  "Books",
  "Accessories",
  "Other"
];

const claimStatuses = [
  "pending",
  "under-review",
  "more-info",
  "approved",
  "rejected",
  "handover-scheduled",
  "returned"
];

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [items, setItems] = useState(() =>
    load(STORAGE_KEY, seedItems).filter(
      i => !String(i.id).startsWith("seed-")
    )
  );

  const [saved, setSaved] = useState(() =>
    load(SAVED_KEY, [])
  );

  const [user, setUser] = useState(() =>
    load(USER_KEY, {
      name: "You",
      email: "you@campus.edu"
    })
  );

  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (!toast) return;

    const t = setTimeout(() => setToast(""), 2600);

    return () => clearTimeout(t);
  }, [toast]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = items.filter(item => {
      const textMatch =
        !q ||
        [
          item.title,
          item.description,
          item.location,
          item.landmark,
          item.category
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const catMatch =
        category === "All" || item.category === category;

      const typeMatch =
        typeFilter === "all" || item.type === typeFilter;

      const dateMatch =
        !dateFilter || item.date === dateFilter;

      const locationMatch =
        !locationFilter ||
        item.location
          .toLowerCase()
          .includes(locationFilter.toLowerCase());

      return (
        textMatch &&
        catMatch &&
        typeMatch &&
        dateMatch &&
        locationMatch &&
        item.status !== "resolved"
      );
    });

    return result.sort((a, b) => {
      if (sort === "alphabetical") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "location") {
        return a.location.localeCompare(b.location);
      }

      if (sort === "oldest") {
        return (
          new Date(a.createdAt || a.date) -
          new Date(b.createdAt || b.date)
        );
      }

      return (
        new Date(b.createdAt || b.date) -
        new Date(a.createdAt || a.date)
      );
    });
  }, [
    items,
    query,
    category,
    typeFilter,
    dateFilter,
    locationFilter,
    sort
  ]);

  const myItems = items.filter(
    i =>
      i.owner === user.name &&
      !String(i.id).startsWith("seed-")
  );

  const myClaims = items.filter(
    i => i.claim?.claimantName === user.name
  );

  const go = p => {
    setSelected(null);
    setPage(p);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const openItem = item => {
    setSelected(item);
    setPage("detail");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const showToast = msg => setToast(msg);

  const toggleSaved = id =>
    setSaved(s =>
      s.includes(id)
        ? s.filter(x => x !== id)
        : [...s, id]
    );

  const createPost = data => {
    const item = {
      ...data,
      id: `user-${Date.now()}`,
      owner: user.name,
      status: "open",
      createdAt: new Date().toISOString()
    };

    setItems(prev => [item, ...prev]);

    showToast("Your post is live.");

    go("my-posts");
  };

  const submitClaim = (item, claimData) => {
    const claim = {
      ...claimData,
      claimantName: user.name,
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    setItems(prev =>
      prev.map(x =>
        x.id === item.id
          ? { ...x, claim }
          : x
      )
    );

    setSelected(prev =>
      prev ? { ...prev, claim } : prev
    );

    showToast("Claim submitted — under review.");
  };

  const updateClaimStatus = (itemId, status) => {
    setItems(prev =>
      prev.map(x =>
        x.id === itemId && x.claim
          ? {
              ...x,
              claim: {
                ...x.claim,
                status
              }
            }
          : x
      )
    );

    setSelected(prev =>
      prev?.id === itemId && prev.claim
        ? {
            ...prev,
            claim: {
              ...prev.claim,
              status
            }
          }
        : prev
    );

    showToast(
      `Claim moved to ${claimLabel(status)}.`
    );
  };

  const deletePost = id => {
    setItems(prev =>
      prev.filter(x => x.id !== id)
    );

    showToast("Post deleted.");
  };

  const clearFilters = () => {
    setCategory("All");
    setTypeFilter("all");
    setDateFilter("");
    setLocationFilter("");
    setSort("newest");
  };

  return (
    <div className="app">
      <Header
        page={page}
        go={go}
        user={user}
      />

      {page === "home" && (
        <Home
          items={filteredItems}
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          openItem={openItem}
          toggleSaved={toggleSaved}
          saved={saved}
          go={go}
          clearFilters={clearFilters}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          sort={sort}
          setSort={setSort}
        />
      )}

      {page === "browse" && (
        <Browse
          items={filteredItems}
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          openItem={openItem}
          toggleSaved={toggleSaved}
          saved={saved}
          clearFilters={clearFilters}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          sort={sort}
          setSort={setSort}
          go={go}
        />
      )}

      {page === "post" && (
        <PostForm
          onSubmit={createPost}
          go={go}
        />
      )}

      {page === "detail" && selected && (
        <Detail
          item={selected}
          saved={saved.includes(selected.id)}
          toggleSaved={toggleSaved}
          submitClaim={submitClaim}
          updateClaimStatus={updateClaimStatus}
          go={go}
          user={user}
        />
      )}

      {page === "saved" && (
        <Saved
          items={items.filter(i =>
            saved.includes(i.id)
          )}
          openItem={openItem}
          toggleSaved={toggleSaved}
        />
      )}

      {page === "my-posts" && (
        <MyPosts
          items={myItems}
          openItem={openItem}
          deletePost={deletePost}
          go={go}
        />
      )}

      {page === "claims" && (
        <MyClaims
          claims={myClaims}
          openItem={openItem}
        />
      )}

      {page === "profile" && (
        <Profile
          user={user}
          setUser={setUser}
          myItems={myItems}
          go={go}
        />
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}

function Header({ page, go, user }) {
  return (
    <header className="header">
      <div className="header-inner">

        <button
          className="brand"
          onClick={() => go("home")}
        >
          <span className="brand-mark">
            <Package size={21} />
          </span>

          <span>
            Find<span className="brand-accent">It</span>
          </span>
        </button>

        <nav className="nav">
          <button
            className={
              page === "home" ? "active" : ""
            }
            onClick={() => go("home")}
          >
            Home
          </button>

          <button
            className={
              page === "browse" ? "active" : ""
            }
            onClick={() => go("browse")}
          >
            Browse
          </button>

          <button
            className={
              page === "saved" ? "active" : ""
            }
            onClick={() => go("saved")}
          >
            Saved
          </button>

          <button
            className={
              page === "my-posts" ? "active" : ""
            }
            onClick={() => go("my-posts")}
          >
            My Posts
          </button>

          <button
            className={
              page === "claims" ? "active" : ""
            }
            onClick={() => go("claims")}
          >
            My Claims
          </button>

          <button
            className="report-nav"
            onClick={() => go("post")}
          >
            <Plus size={15} />
            Report Item
          </button>
        </nav>

        <button
          className="profile-pill"
          onClick={() => go("profile")}
        >
          <span className="avatar">
            {user.name.charAt(0).toUpperCase()}
          </span>

          <span className="desktop-only">
            {user.name}
          </span>
        </button>

      </div>
    </header>
  );
}

function Home(props) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">

          <div className="eyebrow">
            <Sparkles size={15} />
            CAMPUS LOST & FOUND
          </div>

          <h1>
            Lost something?
            <br />
            <span>Let’s find it.</span>
          </h1>

          <p>
            One place for students to report,
            discover, and reunite with the things
            that matter.
          </p>

          <div className="hero-actions">
            <button
              className="btn primary"
              onClick={() => props.go("post")}
            >
              <Plus size={18} />
              Report an item
            </button>

            <button
              className="btn ghost-light"
              onClick={() => props.go("browse")}
            >
              Browse items
              <ChevronRight size={17} />
            </button>
          </div>

        </div>

        <div className="hero-art">
          <div className="float-card card-a">
            <span>📍</span>
            <div>
              <b>Lost & Found</b>
              <small>Campus community</small>
            </div>
          </div>

          <div className="float-card card-b">
            <span>🛡️</span>
            <div>
              <b>Safer claims</b>
              <small>Verified details</small>
            </div>
          </div>

          <div className="hero-circle">
            <Package
              size={88}
              strokeWidth={1.2}
            />
          </div>
        </div>
      </section>

      <main className="container">
        <div className="section-head">
          <div>
            <p className="section-kicker">
              DISCOVER
            </p>

            <h2>Recently reported</h2>
          </div>

          <button
            className="text-btn"
            onClick={() => props.go("browse")}
          >
            View all
            <ChevronRight size={16} />
          </button>
        </div>

        <SearchBar {...props} />

        {props.showFilters && (
          <FilterBar {...props} />
        )}

        <div className="mini-tabs">
          <button
            className={
              props.typeFilter === "all"
                ? "selected"
                : ""
            }
            onClick={() =>
              props.setTypeFilter("all")
            }
          >
            All items
          </button>

          <button
            className={
              props.typeFilter === "lost"
                ? "selected"
                : ""
            }
            onClick={() =>
              props.setTypeFilter("lost")
            }
          >
            Lost
          </button>

          <button
            className={
              props.typeFilter === "found"
                ? "selected"
                : ""
            }
            onClick={() =>
              props.setTypeFilter("found")
            }
          >
            Found
          </button>
        </div>

        <ItemGrid
          items={props.items.slice(0, 6)}
          openItem={props.openItem}
          toggleSaved={props.toggleSaved}
          saved={props.saved}
        />
      </main>
    </>
  );
}

function Browse(props) {
  return (
    <main className="container page-pad">

      <div className="page-title">
        <div>
          <p className="section-kicker">
            EXPLORE
          </p>

          <h1>Browse items</h1>

          <p>
            Search, sort and filter campus
            listings.
          </p>
        </div>

        <div className="stat-chip">
          <Package size={17} />
          {props.items.length} active listings
        </div>
      </div>

      <SearchBar {...props} />

      {props.showFilters && (
        <FilterBar {...props} />
      )}

      <ItemGrid
        items={props.items}
        openItem={props.openItem}
        toggleSaved={props.toggleSaved}
        saved={props.saved}
      />

      {props.items.length === 0 && (
        <EmptyState
          title="No matching items"
          text="Try another search or clear your filters."
          action={props.clearFilters}
          actionText="Clear all filters"
        />
      )}
    </main>
  );
}

function SearchBar({
  query,
  setQuery,
  setShowFilters
}) {
  return (
    <div className="search-row">

      <div className="search-box">
        <Search size={20} />

        <input
          value={query}
          onChange={e =>
            setQuery(e.target.value)
          }
          placeholder="Search by item, location, landmark, or description..."
        />
      </div>

      <button
        className="filter-btn"
        onClick={() =>
          setShowFilters(v => !v)
        }
      >
        <SlidersHorizontal size={18} />
        Filters
      </button>

    </div>
  );
}

function FilterBar({
  category,
  setCategory,
  typeFilter,
  setTypeFilter,
  dateFilter,
  setDateFilter,
  locationFilter,
  setLocationFilter,
  sort,
  setSort,
  clearFilters
}) {
  return (
    <div className="filter-panel enhanced-filter">

      <div>
        <label>Category</label>

        <select
          value={category}
          onChange={e =>
            setCategory(e.target.value)
          }
        >
          {categories.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Type</label>

        <select
          value={typeFilter}
          onChange={e =>
            setTypeFilter(e.target.value)
          }
        >
          <option value="all">All</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
      </div>

      <div>
        <label>Date</label>

        <input
          type="date"
          value={dateFilter}
          onChange={e =>
            setDateFilter(e.target.value)
          }
        />
      </div>

      <div>
        <label>Location</label>

        <input
          value={locationFilter}
          onChange={e =>
            setLocationFilter(e.target.value)
          }
          placeholder="e.g. Library"
        />
      </div>

      <div>
        <label>Sort</label>

        <select
          value={sort}
          onChange={e =>
            setSort(e.target.value)
          }
        >
          <option value="newest">
            Newest date
          </option>

          <option value="oldest">
            Oldest date
          </option>

          <option value="alphabetical">
            Alphabetical
          </option>

          <option value="location">
            Location
          </option>
        </select>
      </div>

      <button
        className="clear-filter-btn"
        onClick={clearFilters}
      >
        <RotateCcw size={15} />
        Clear all filters
      </button>

    </div>
  );
}

function ItemGrid({
  items,
  openItem,
  toggleSaved,
  saved
}) {
  return (
    <div className="grid">
      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          openItem={openItem}
          toggleSaved={toggleSaved}
          saved={saved.includes(item.id)}
        />
      ))}
    </div>
  );
}

function ItemCard({
  item,
  openItem,
  toggleSaved,
  saved
}) {
  return (
    <article
      className="item-card"
      onClick={() => openItem(item)}
    >
      <div className="item-image">

        <img
          src={item.image}
          alt={item.title}
        />

        <span
          className={`type-badge ${item.type}`}
        >
          {item.type === "lost"
            ? "Lost"
            : "Found"}
        </span>

        <button
          className="save-btn"
          onClick={e => {
            e.stopPropagation();
            toggleSaved(item.id);
          }}
        >
          {saved ? (
            <BookmarkCheck size={18} />
          ) : (
            <Bookmark size={18} />
          )}
        </button>

      </div>

      <div className="item-body">
        <div className="item-category">
          {item.category}
        </div>

        <h3>{item.title}</h3>

        <p className="item-desc">
          {item.description}
        </p>

        <div className="item-meta">
          <span>
            <MapPin size={14} />
            {item.location}
          </span>

          <span>
            <CalendarDays size={14} />
            {formatDate(item.date)}
          </span>
        </div>
      </div>
    </article>
  );
}

function Detail({
  item,
  saved,
  toggleSaved,
  submitClaim,
  updateClaimStatus,
  go,
  user
}) {
  const isMine = item.owner === user.name;

  return (
    <main className="container page-pad">

      <button
        className="back-btn"
        onClick={() => go("browse")}
      >
        <ArrowLeft size={17} />
        Back to listings
      </button>

      <div className="detail">

        <div className="detail-image">
          <img
            src={item.image}
            alt={item.title}
          />

          <span
            className={`type-badge large ${item.type}`}
          >
            {item.type === "lost"
              ? "Lost item"
              : "Found item"}
          </span>
        </div>

        <div className="detail-content">

          <div className="item-category">
            {item.category}
          </div>

          <h1>{item.title}</h1>

          <p className="detail-description">
            {item.description}
          </p>

          <div className="detail-facts">

            <div>
              <MapPin />

              <span>
                <small>Location</small>
                <b>{item.location}</b>
              </span>
            </div>

            <div>
              <MapPin />

              <span>
                <small>Landmark</small>
                <b>
                  {item.landmark ||
                    "Not provided"}
                </b>
              </span>
            </div>

            <div>
              <CalendarDays />

              <span>
                <small>Date & time</small>
                <b>
                  {formatDate(item.date)} ·{" "}
                  {item.time || "—"}
                </b>
              </span>
            </div>

            <div>
              <User />

              <span>
                <small>Posted by</small>
                <b>{item.owner}</b>
              </span>
            </div>

          </div>

          {item.distinctiveMarks && (
            <div className="info-card">
              <ShieldCheck size={19} />

              <div>
                <b>Identifying details</b>
                <p>
                  {item.distinctiveMarks}
                </p>
              </div>
            </div>
          )}

          {item.claim && (
            <ClaimStatusCard
              claim={item.claim}
              owner={isMine}
              onStatus={status =>
                updateClaimStatus(
                  item.id,
                  status
                )
              }
            />
          )}

          <div className="detail-actions">

            {!isMine && item.type === "found" && !item.claim && (
              <ClaimForm
                item={item}
                onSubmit={data => submitClaim(item, data)}
              />
            )}

            {!isMine && item.type === "found" && item.claim && (
              <div className="claim-already-submitted">
                <CheckCircle2 size={18} />
                <span>
                  <b>Claim submitted</b>
                  <small>{claimLabel(item.claim.status)}</small>
                </span>
              </div>
            )}

            <button
              className="btn outline wide"
              onClick={() =>
                toggleSaved(item.id)
              }
            >
              {saved ? (
                <BookmarkCheck size={18} />
              ) : (
                <Bookmark size={18} />
              )}

              {saved
                ? "Saved"
                : "Save item"}
            </button>

          </div>

          <div className="safety-note">
            <ShieldCheck size={17} />

            <span>
              Never ask a claimant to post full
              proof publicly. Verify ownership
              privately and arrange handover in
              a safe campus location.
            </span>
          </div>

        </div>
      </div>
    </main>
  );
}

function ClaimForm({ onSubmit }) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    distinctiveMarks: "",
    ownershipProof: "",
    phoneLast4: ""
  });

  const [error, setError] = useState("");

  const update = (k, v) =>
    setForm(f => ({
      ...f,
      [k]: v
    }));

  if (!open) {
    return (
      <button
        type="button"
        className="btn primary wide claim-open-btn"
        onClick={() => setOpen(true)}
      >
        <ShieldCheck size={18} />
        This is mine — submit a claim
      </button>
    );
  }

  const submit = e => {
    e.preventDefault();

    if (
      !form.distinctiveMarks ||
      !form.ownershipProof ||
      !/^\d{4}$/.test(form.phoneLast4)
    ) {
      setError(
        "Add distinctive marks, proof of ownership, and exactly 4 phone digits."
      );

      return;
    }

    setError("");

    onSubmit(form);
  };

  return (
    <form
      className="claim-form"
      onSubmit={submit}
    >
      <div className="claim-heading">
        <ShieldCheck size={20} />

        <div>
          <b>Safer claim</b>

          <p>
            These details are shared with the
            poster for verification.
          </p>
        </div>
      </div>

      <Field
        label="Distinctive marks / identifying details"
        required
      >
        <textarea
          value={form.distinctiveMarks}
          onChange={e =>
            update(
              "distinctiveMarks",
              e.target.value
            )
          }
          placeholder="What makes this item uniquely yours?"
          rows="3"
        />
      </Field>

      <Field
        label="Proof of ownership"
        required
      >
        <textarea
          value={form.ownershipProof}
          onChange={e =>
            update(
              "ownershipProof",
              e.target.value
            )
          }
          placeholder="Describe the proof you can show privately (receipt, serial number, photo, etc.)."
          rows="3"
        />
      </Field>

      <Field
        label="Last 4 digits of your phone"
        required
      >
        <input
          inputMode="numeric"
          maxLength="4"
          value={form.phoneLast4}
          onChange={e =>
            update(
              "phoneLast4",
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 4)
            )
          }
          placeholder="1234"
        />
      </Field>

      {error && (
        <div className="error">
          <X size={16} />
          {error}
        </div>
      )}

      <div className="claim-form-actions">
        <button
          className="btn outline wide"
          type="button"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>

        <button
          className="btn primary wide"
          type="submit"
        >
          <ShieldCheck size={17} />
          Submit secure claim
        </button>
      </div>
    </form>
  );
}

function ClaimStatusCard({
  claim,
  owner,
  onStatus
}) {
  return (
    <div className="claim-status-card">

      <div className="claim-status-head">
        <div>
          <p className="section-kicker">
            CLAIM
          </p>

          <h3>
            {claimLabel(claim.status)}
          </h3>
        </div>

        <Clock3 size={21} />
      </div>

      <ClaimTimeline
        status={claim.status}
      />

      <div className="claim-evidence">
        <p>
          <b>Distinctive marks:</b>{" "}
          {claim.distinctiveMarks}
        </p>

        <p>
          <b>Ownership proof:</b>{" "}
          {claim.ownershipProof}
        </p>

        <p>
          <b>Phone:</b> ••••{" "}
          {claim.phoneLast4}
        </p>
      </div>

      {owner && (
        <div className="claim-controls">
          <label>
            Update claim status
          </label>

          <select
            value={claim.status}
            onChange={e =>
              onStatus(e.target.value)
            }
          >
            {claimStatuses.map(s => (
              <option
                key={s}
                value={s}
              >
                {claimLabel(s)}
              </option>
            ))}
          </select>
        </div>
      )}

    </div>
  );
}

function ClaimTimeline({ status }) {
  const idx = claimStatuses.indexOf(status);

  return (
    <div className="claim-timeline">
      {claimStatuses.map((s, i) => (
        <div
          key={s}
          className={`timeline-step ${
            i <= idx ? "done" : ""
          } ${
            i === idx ? "current" : ""
          }`}
        >
          <span>
            {i < idx ? (
              <CheckCircle2 size={14} />
            ) : i === idx ? (
              <Clock3 size={14} />
            ) : (
              i + 1
            )}
          </span>

          <small>
            {claimLabel(s)}
          </small>
        </div>
      ))}
    </div>
  );
}

function claimLabel(s) {
  return (
    {
      pending: "Claim submitted",
      "under-review": "Under review",
      "more-info": "More information requested",
      approved: "Approved",
      rejected: "Rejected",
      "handover-scheduled":
        "Handover scheduled",
      returned: "Returned"
    }[s] || s
  );
}

function PostForm({ onSubmit, go }) {
  const [form, setForm] = useState({
    type: "lost",
    title: "",
    category: "Electronics",
    location: "",
    landmark: "",
    date: new Date()
      .toISOString()
      .slice(0, 10),
    time: new Date()
      .toTimeString()
      .slice(0, 5),
    description: "",
    distinctiveMarks: "",
    image: ""
  });

  const [preview, setPreview] =
    useState("");

  const [error, setError] =
    useState("");

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiNote, setAiNote] =
    useState("");

  const [confirm, setConfirm] =
    useState(false);

  const fileInputRef = useRef(null);

  const update = (key, val) =>
    setForm(f => ({
      ...f,
      [key]: val
    }));

  const recognizeWithAI = async () => {
    if (!form.image) {
      setError(
        "Add a photo first so AI can recognize the item."
      );
      return;
    }

    setAiLoading(true);
    setAiNote("");
    setError("");

    try {
      const res = await fetch(
        "/api/recognize",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            image: form.image
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "AI recognition failed."
        );
      }

      setForm(f => ({
        ...f,
        title:
          data.title || f.title,
        category:
          categories.includes(
            data.category
          )
            ? data.category
            : f.category,
        description:
          data.description ||
          f.description
      }));

      setAiNote(
        data.note ||
          "AI filled the item details. Please verify them before publishing."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not recognize the image."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const file = e => {
    const f = e.target.files?.[0];

    if (!f) return;

    setError("");
    setAiNote("");

    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      e.target.value = "";
      return;
    }

    if (f.size > 4 * 1024 * 1024) {
      setError("Please choose an image smaller than 4MB.");
      e.target.value = "";
      return;
    }

    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (!supportedTypes.includes(f.type)) {
      setError(
        "This image format is not supported. Please use JPG, PNG, WebP, or GIF."
      );
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      const result = event.target?.result;

      if (typeof result !== "string" || !result.startsWith("data:image/")) {
        setError("The image could not be loaded. Please try another image.");
        return;
      }

      setPreview(result);
      update("image", result);
    };

    reader.onerror = () => {
      setError("The image could not be read. Please try another image.");
    };

    reader.readAsDataURL(f);
  };

  const removeImage = () => {
    setPreview("");
    update("image", "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = e => {
    e.preventDefault();

    if (
      !form.title ||
      !form.location ||
      !form.description ||
      !form.image
    ) {
      setError(
        "Please complete the required fields and add a photo."
      );
      return;
    }

    setError("");
    setConfirm(true);
  };

  if (confirm) {
    return (
      <ConfirmationScreen
        form={form}
        onBack={() =>
          setConfirm(false)
        }
        onConfirm={() =>
          onSubmit(form)
        }
      />
    );
  }

  return (
    <main className="container page-pad narrow">

      <button
        className="back-btn"
        onClick={() => go("home")}
      >
        <ArrowLeft size={17} />
        Cancel
      </button>

      <div className="form-heading">
        <p className="section-kicker">
          CREATE LISTING
        </p>

        <h1>Report an item</h1>

        <p>
          Give the campus community enough
          detail to help reunite an item with
          its owner.
        </p>
      </div>

      <form
        className="post-form"
        onSubmit={validate}
      >
        <div className="type-toggle">

          <button
            type="button"
            className={
              form.type === "lost"
                ? "on"
                : ""
            }
            onClick={() =>
              update("type", "lost")
            }
          >
            I lost something
          </button>

          <button
            type="button"
            className={
              form.type === "found"
                ? "on"
                : ""
            }
            onClick={() =>
              update("type", "found")
            }
          >
            I found something
          </button>

        </div>

        <div className={`upload ${preview ? "has-image" : ""}`}>

          {preview ? (
            <>
              <img
                src={preview}
                alt="Selected item"
              />

              <button
                type="button"
                className="remove-image-btn"
                onClick={e => {
                  e.stopPropagation();
                  removeImage();
                }}
              >
                <X size={16} />
                Remove image
              </button>
            </>
          ) : (
            <button
              type="button"
              className="upload-picker"
              onClick={openFilePicker}
            >
              <Camera size={30} />
              <b>Add a photo</b>
              <span>Click to choose a JPG, PNG, WebP, or GIF</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={file}
            className="real-file-input"
          />

          {preview && (
            <button
              type="button"
              className="change-image-btn"
              onClick={openFilePicker}
            >
              <Camera size={15} />
              Change image
            </button>
          )}
        </div>

        {preview && (
          <div className="ai-recognition">

            <div className="ai-recognition-copy">

              <div className="ai-icon">
                <Sparkles size={17} />
              </div>

              <div>
                <b>
                  AI item recognition
                </b>

                <p>
                  Let Gemini identify the item
                  and suggest a category and
                  description.
                </p>
              </div>

            </div>

            <button
              type="button"
              className="btn ai-btn"
              onClick={recognizeWithAI}
              disabled={aiLoading}
            >
              <Sparkles size={17} />

              {aiLoading
                ? "Recognizing..."
                : "Recognize with AI"}
            </button>

            {aiNote && (
              <div className="ai-note">
                {aiNote}
              </div>
            )}

          </div>
        )}

        <div className="form-grid">

          <Field
            label="Item name"
            required
          >
            <input
              value={form.title}
              onChange={e =>
                update(
                  "title",
                  e.target.value
                )
              }
              placeholder="e.g. Black AirPods Pro"
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={e =>
                update(
                  "category",
                  e.target.value
                )
              }
            >
              {categories
                .filter(x => x !== "All")
                .map(c => (
                  <option key={c}>
                    {c}
                  </option>
                ))}
            </select>
          </Field>

          <Field
            label="Location"
            required
          >
            <input
              value={form.location}
              onChange={e =>
                update(
                  "location",
                  e.target.value
                )
              }
              placeholder="e.g. Main Library"
            />
          </Field>

          <Field label="Landmark / location details">
            <input
              value={form.landmark}
              onChange={e =>
                update(
                  "landmark",
                  e.target.value
                )
              }
              placeholder="e.g. Near the north entrance / Room 204"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={e =>
                update(
                  "date",
                  e.target.value
                )
              }
            />
          </Field>

          <Field label="Time">
            <input
              type="time"
              value={form.time}
              onChange={e =>
                update(
                  "time",
                  e.target.value
                )
              }
            />
          </Field>

        </div>

        <Field
          label="Item description"
          required
        >
          <textarea
            value={form.description}
            onChange={e =>
              update(
                "description",
                e.target.value
              )
            }
            placeholder="Color, brand, condition, where exactly it was seen, etc."
            rows="5"
          />
        </Field>

        <Field label="Distinctive marks">
          <textarea
            value={form.distinctiveMarks}
            onChange={e =>
              update(
                "distinctiveMarks",
                e.target.value
              )
            }
            placeholder="Sticker, scratch, engraving, case, unique mark, etc."
            rows="3"
          />
        </Field>

        {error && (
          <div className="error">
            <X size={16} />
            {error}
          </div>
        )}

        <button
          className="btn primary wide"
          type="submit"
        >
          <CheckCircle2 size={18} />
          Review before posting
        </button>

      </form>
    </main>
  );
}

function ConfirmationScreen({
  form,
  onBack,
  onConfirm
}) {
  return (
    <main className="container page-pad narrow">

      <div className="confirmation-card">

        <div className="confirmation-icon">
          <CheckCircle2 size={30} />
        </div>

        <p className="section-kicker">
          FINAL CHECK
        </p>

        <h1>
          Confirm your listing
        </h1>

        <p>
          Review everything before this item
          is published.
        </p>

        {form.image && (
          <img
            className="confirm-image"
            src={form.image}
            alt="Item preview"
          />
        )}

        <div className="confirm-grid">

          <ConfirmRow
            label="Type"
            value={
              form.type === "lost"
                ? "Lost"
                : "Found"
            }
          />

          <ConfirmRow
            label="Item"
            value={form.title}
          />

          <ConfirmRow
            label="Category"
            value={form.category}
          />

          <ConfirmRow
            label="Location"
            value={form.location}
          />

          <ConfirmRow
            label="Landmark"
            value={
              form.landmark || "—"
            }
          />

          <ConfirmRow
            label="Date & time"
            value={`${formatDate(
              form.date
            )} · ${form.time || "—"}`}
          />

          <ConfirmRow
            label="Description"
            value={form.description}
          />

          <ConfirmRow
            label="Distinctive marks"
            value={
              form.distinctiveMarks || "—"
            }
          />

        </div>

        <div className="confirmation-actions">

          <button
            className="btn outline"
            onClick={onBack}
          >
            Edit listing
          </button>

          <button
            className="btn primary"
            onClick={onConfirm}
          >
            <CheckCircle2 size={18} />
            Confirm & publish
          </button>

        </div>

      </div>
    </main>
  );
}

function ConfirmRow({
  label,
  value
}) {
  return (
    <div className="confirm-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Saved({
  items,
  openItem,
  toggleSaved
}) {
  return (
    <main className="container page-pad">

      <div className="page-title">
        <div>
          <p className="section-kicker">
            YOUR LIST
          </p>

          <h1>Saved items</h1>
        </div>

        <div className="stat-chip">
          <Bookmark size={17} />
          {items.length} saved
        </div>
      </div>

      {items.length ? (
        <ItemGrid
          items={items}
          openItem={openItem}
          toggleSaved={toggleSaved}
          saved={items.map(i => i.id)}
        />
      ) : (
        <EmptyState
          title="Nothing saved yet"
          text="Tap the bookmark on any listing to save it here."
        />
      )}

    </main>
  );
}

function MyPosts({
  items,
  openItem,
  deletePost,
  go
}) {
  return (
    <main className="container page-pad">

      <div className="page-title">

        <div>
          <p className="section-kicker">
            YOUR ACTIVITY
          </p>

          <h1>My posts</h1>

          <p>
            Manage listings and claim progress.
          </p>
        </div>

        <button
          className="btn primary"
          onClick={() => go("post")}
        >
          <Plus size={17} />
          New post
        </button>

      </div>

      {items.length ? (
        <div className="my-list">

          {items.map(item => (
            <div
              className="my-row"
              key={item.id}
              onClick={() =>
                openItem(item)
              }
            >
              <img
                src={item.image}
                alt=""
              />

              <div className="my-row-info">

                <span
                  className={`tiny-type ${item.type}`}
                >
                  {item.type}
                </span>

                <h3>
                  {item.title}
                </h3>

                <p>
                  {item.location} ·{" "}
                  {formatDate(item.date)}
                </p>

                {item.claim && (
                  <small className="claim-mini">
                    Claim:{" "}
                    {claimLabel(
                      item.claim.status
                    )}
                  </small>
                )}

              </div>

              <span className="status">
                {item.claim
                  ? claimLabel(
                      item.claim.status
                    )
                  : "Active"}
              </span>

              <button
                className="icon-btn danger"
                onClick={e => {
                  e.stopPropagation();
                  deletePost(item.id);
                }}
              >
                <Trash2 size={17} />
              </button>

            </div>
          ))}

        </div>
      ) : (
        <EmptyState
          title="You haven't posted anything"
          text="Create a lost or found listing to get started."
          action={() => go("post")}
          actionText="Create a post"
        />
      )}

    </main>
  );
}

function MyClaims({
  claims,
  openItem
}) {
  return (
    <main className="container page-pad">

      <div className="page-title">
        <div>
          <p className="section-kicker">
            CLAIMS
          </p>

          <h1>My claims</h1>

          <p>
            Track every claim through the
            review and handover process.
          </p>
        </div>
      </div>

      {claims.length ? (
        <div className="claims-list">

          {claims.map(item => (
            <button
              className="claim-list-card"
              key={item.id}
              onClick={() =>
                openItem(item)
              }
            >
              <img
                src={item.image}
                alt=""
              />

              <span>
                <b>{item.title}</b>

                <small>
                  {item.location}
                </small>

                <strong>
                  {claimLabel(
                    item.claim.status
                  )}
                </strong>
              </span>

              <ChevronRight size={18} />
            </button>
          ))}

        </div>
      ) : (
        <EmptyState
          title="No claims yet"
          text="Open a found item and submit a safer claim."
        />
      )}

    </main>
  );
}

function Profile({
  user,
  setUser,
  myItems,
  go
}) {
  const [name, setName] =
    useState(user.name);

  const [email, setEmail] =
    useState(user.email);

  return (
    <main className="container page-pad narrow">

      <div className="profile-hero">

        <div className="big-avatar">
          {user.name
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <p className="section-kicker">
            ACCOUNT
          </p>

          <h1>Your profile</h1>
        </div>

      </div>

      <div className="profile-card">

        <Field label="Display name">
          <input
            value={name}
            onChange={e =>
              setName(e.target.value)
            }
          />
        </Field>

        <Field label="Campus email">
          <input
            value={email}
            onChange={e =>
              setEmail(e.target.value)
            }
          />
        </Field>

        <button
          className="btn primary"
          onClick={() => {
            setUser({
              name: name || "You",
              email
            });

            go("home");
          }}
        >
          Save changes
        </button>

      </div>

      <div className="profile-stats">

        <div>
          <b>{myItems.length}</b>
          <span>Your posts</span>
        </div>

        <div>
          <b>Local</b>
          <span>Storage mode</span>
        </div>

        <div>
          <b>AI</b>
          <span>Recognition enabled</span>
        </div>

      </div>

    </main>
  );
}

function Field({
  label,
  required,
  children
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && " *"}
      </span>

      {children}
    </label>
  );
}

function EmptyState({
  title,
  text,
  action,
  actionText
}) {
  return (
    <div className="empty">

      <div className="empty-icon">
        <Inbox size={28} />
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

      {action && (
        <button
          className="btn primary"
          onClick={action}
        >
          {actionText}
        </button>
      )}

    </div>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-inner">

        <div className="brand">
          <span className="brand-mark">
            <Package size={17} />
          </span>

          <span>
            Find<span className="brand-accent">
              It
            </span>
          </span>
        </div>

        <p>
          Campus lost & found, made simpler.
        </p>

        <span>
          Prototype · LocalStorage
        </span>

      </div>
    </footer>
  );
}

function formatDate(date) {
  try {
    return new Intl.DateTimeFormat(
      "en",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    ).format(
      new Date(`${date}T12:00:00`)
    );
  } catch {
    return date;
  }
}

createRoot(
  document.getElementById("root")
  
).render(<App />);
import "./styles.css";
import "./findit-enhancements.css";
import "./FindIt-Hackathon-Premium-UI.css";