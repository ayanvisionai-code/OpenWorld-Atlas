/* OpenWorld Atlas — runtime: data store, search and renderers */
(function () {
  "use strict";
  const SITE = window.OPENWORLD_ATLAS || { name: "OpenWorld Atlas", wordmark: "OPENWORLD ATLAS", tagline: "Explore Every Detail." };

  /* ---------------- Data store ---------------- */
  const DB = {
    cheats: { cheats: [], howTo: [] }, characters: { characters: [] }, vehicles: { vehicles: [] },
    weapons: { weapons: [] }, locations: { regions: [] }, missions: { missions: [], chapters: [] },
    guides: { guides: [] }, news: { news: [] }
  };
  let dataLoadState = "loading";

  /* Supabase config: provided by js/env.js (public values only — URL + publishable key).
     Absent file → JSON fallback; the site never breaks. */
  const SB_URL = (typeof window.SUPABASE_URL === "string" && window.SUPABASE_URL.includes(".supabase.co")) ? window.SUPABASE_URL.replace(/\/$/, "") : null;
  const SB_KEY = (typeof window.SUPABASE_PUBLISHABLE_KEY === "string" && window.SUPABASE_PUBLISHABLE_KEY.length > 20) ? window.SUPABASE_PUBLISHABLE_KEY : null;
  const SB_ON = !!(SB_URL && SB_KEY);

  /* Map a content row (PostgREST) into the entity shape the renderers expect */
  function rowToRecord(r) {
    const f = r.fields || {};
    return Object.assign({}, f, {
      id: f.id || r.slug,
      name: f.name || r.title,
      title: f.title || r.title,
      summary: f.summary || r.description || "",
      description: f.description || r.description || "",
      details: f.details || r.body || "",
      date: f.date || r.published_at || "",
      imageUrl: f.imageUrl || r.featured_image_url || "",
      imageAlt: f.imageAlt || r.image_alt || "",
      verification: f.verification || r.verification || "UNKNOWN",
      verifiedAt: r.verified_at || "",
      reviewedAt: r.reviewed_at || "",
      correctionNote: r.correction_note || "",
      sources: f.sources || []
    });
  }
  const TYPE_TO_DB = {
    cheat: "cheats", character: "characters", vehicle: "vehicles", weapon: "weapons",
    location: "locations", mission: "missions", guide: "guides", news: "news"
  };
  const DB_LIST_KEY = { cheats: "cheats", characters: "characters", vehicles: "vehicles", weapons: "weapons", locations: "regions", missions: "missions", guides: "guides", news: "news" };

  async function sbRest(path, opts) {
    const r = await fetch(SB_URL + path, Object.assign({
      headers: Object.assign({ apikey: SB_KEY, Authorization: "Bearer " + SB_KEY }, (opts && opts.headers) || {})
    }, opts || {}));
    if (!r.ok) throw new Error("supabase " + r.status);
    return r.json();
  }

  /* Public pages render only published Supabase rows. Seed JSON remains an editorial
     import source and is never silently presented as current public database content. */
  const READY = (async () => {
    if (!SB_ON) { dataLoadState = "unconfigured"; return; }
    try {
      const rows = await sbRest("/rest/v1/content?select=*&status=eq.published&editorial_status=eq.approved&order=updated_at.desc", {});
      if (!Array.isArray(rows)) throw new Error("invalid public content response");
      for (const r of rows) {
        const dbKey = TYPE_TO_DB[r.type]; if (!dbKey || !DB[dbKey]) continue;
        const list = DB[dbKey][DB_LIST_KEY[dbKey]];
        if (list) list.push(rowToRecord(r));
      }
      dataLoadState = "ready";
      console.info("[OpenWorld Atlas] loaded " + rows.length + " published records from Supabase");
    } catch (e) {
      dataLoadState = "error";
      console.warn("[OpenWorld Atlas] public content could not be loaded:", e.message);
    }
  })();

  /* Supabase JS client (lazy, only for authenticated admin features) */
  let _sbPromise = null;
  function sb() {
    if (!SB_ON) return Promise.resolve(null);
    if (!_sbPromise) _sbPromise = import("https://esm.sh/@supabase/supabase-js@2").then(m => m.createClient(SB_URL, SB_KEY));
    return _sbPromise;
  }

  /* Server-side search (no full-DB download): PostgREST ilike per word, merged client-side */
  async function serverSearch(q, limit) {
    if (!SB_ON) return null;
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length >= 3).slice(0, 4);
    if (!words.length) return null;
    const ors = words.map(w =>
      `title.ilike.*${w}*,description.ilike.*${w}*,fields->>name.ilike.*${w}*,fields->>effect.ilike.*${w}*,fields->>keywords.ilike.*${w}*`).join(",");
    const rows = await sbRest(`/rest/v1/content?select=*&status=eq.published&editorial_status=eq.approved&or=(${ors})&limit=${limit || 40}`, {});
    return rows.map(r => ({
      r: {
        type: r.type,
        title: r.title,
        desc: r.description || "",
        badge: r.verification,
        url: "/detail?type=" + r.type + "&id=" + r.slug
      },
      s: 50
    }));
  }

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const badge = st => {
    if (st === "OFFICIALLY_CONFIRMED") return '<span class="badge confirmed">● Confirmed by official sources</span>';
    if (st === "INDEPENDENTLY_VERIFIED") return '<span class="badge confirmed">● Independently verified</span>';
    if (st === "REPORTED") return '<span class="badge unconfirmed">● Reported</span>';
    if (st === "UNCONFIRMED") return '<span class="badge unconfirmed">● Unconfirmed</span>';
    if (st === "SPECULATION") return '<span class="badge speculation">● Speculation</span>';
    if (st === "CORRECTED_OUTDATED") return '<span class="badge unavailable">● Corrected or outdated</span>';
    return '<span class="badge unavailable">● Unknown / not available</span>';
  };
  const na = v => (v == null || v === "" ? '<span class="na">Not confirmed yet</span>' : esc(v));
  const inputChips = arr => arr ? '<div class="cheat">' + arr.map(d => `<span>${esc(d)}</span>`).join("") + "</div>" : '<span class="na">Input not yet discovered</span>';
  const srcLine = arr => {
    if (!Array.isArray(arr) || !arr.length) return "";
    const links = arr.map(u => {
      try {
        const parsed = new URL(u);
        return `<a href="${esc(parsed.href)}" rel="noopener" target="_blank">${esc(parsed.hostname.replace("www.", ""))}</a>`;
      } catch (_) { return ""; }
    }).filter(Boolean);
    return links.length ? '<div class="srcline"><b>Sources:</b> ' + links.join(" · ") + "</div>" : "";
  };
  const LEV = (a, b) => { a = a || ""; b = b || ""; if (!a.length) return b.length; if (!b.length) return a.length; let v0 = [], v1 = new Array(b.length + 1); for (let j = 0; j <= b.length; j++) v0[j] = j; for (let i = 1; i <= a.length; i++) { v1[0] = i; for (let j = 1; j <= b.length; j++) { const cost = a[i-1] === b[j-1] ? 0 : 1; v1[j] = Math.min(v1[j-1] + 1, v0[j] + 1, v0[j-1] + cost); } [v0, v1] = [v1, v0]; } return v0[b.length]; };

  /* ---------------- Search index ---------------- */
  const SYN = { gta:"gta", vi:"gta", money:"cash dollars rich", car:"vehicle auto", cheat:"cheats codes", map:"leonida world", pc:"computer steam windows", online:"multiplayer", trans:"gender lucia rumor", jason:"protagonist", lucia:"protagonist", jet:"plane aircraft lazer", gun:"weapon", weapon:"gun", tank:"military vehicle", helicopter:"chopper aircraft", ending:"finale final mission", length:"hours long beat", price:"cost dollars", review:"metacritic score rating", sales:"copies revenue record" };
  let INDEX = [];
  function buildIndex() {
    INDEX = [];
    const push = o => INDEX.push(o);
    // cheats
    DB.cheats.cheats.forEach(c => push({
      type: "Cheat code", id: c.id, title: c.name + " cheat", url: "/detail?type=cheat&id=" + c.id,
      desc: c.effect, badge: c.verification || "UNKNOWN",
      cat: "Cheat — " + c.category, weight: 1.15,
      keywords: (c.keywords || []).join(" "), text: (c.effect + " " + c.unlock).toLowerCase()
    }));
    // characters
    DB.characters.characters.forEach(c => push({
      type: "Character", id: c.id, title: c.name, url: "/detail?type=character&id=" + c.id,
      desc: c.summary || (c.details || "").slice(0, 130), badge: c.verification, cat: c.type || "Character", weight: 1.1,
      keywords: (c.keywords || []).join(" ") + " " + (c.voice || ""), text: (c.details || "").toLowerCase()
    }));
    // vehicles
    DB.vehicles.vehicles.forEach(v => push({
      type: "Vehicle", id: v.id, title: v.name, url: "/detail?type=vehicle&id=" + v.id,
      desc: v.description || "", badge: v.verification, cat: v.category, weight: 1,
      keywords: (v.keywords || []).join(" ") + " " + (v.manufacturer || ""), text: (v.description + " " + (v.acquisition || "")).toLowerCase()
    }));
    // weapons
    DB.weapons.weapons.forEach(w => push({
      type: "Weapon", id: w.id, title: w.name, url: "/detail?type=weapon&id=" + w.id,
      desc: w.description || "", badge: w.verification, cat: w.category, weight: 1,
      keywords: (w.keywords || []).join(" "), text: (w.description + " " + (w.acquisition || "")).toLowerCase()
    }));
    // locations
    DB.locations.regions.forEach(l => push({
      type: "Location", id: l.id, title: l.name, url: "/detail?type=location&id=" + l.id,
      desc: l.officialText, badge: l.verification, cat: l.category, weight: 1.05,
      keywords: (l.keywords || []).join(" "), text: ((l.officialText || "") + " " + (l.places || []).join(" ")).toLowerCase()
    }));
    // missions
    DB.missions.missions.forEach(m => push({
      type: "Mission", id: m.id, title: m.name, url: "/detail?type=mission&id=" + m.id,
      desc: (m.summary || "").slice(0, 140), badge: m.verification, cat: "Chapter " + m.chapter, weight: 1,
      keywords: (m.keywords || []).join(" "), text: (m.summary + " " + JSON.stringify(m.objectives || [])).toLowerCase()
    }));
    // guides
    DB.guides.guides.forEach(g => push({
      type: "Guide", id: g.id, title: g.title, url: "/detail?type=guide&id=" + g.id, desc: g.summary, badge: g.verification,
      cat: g.category, weight: 1, keywords: (g.keywords || []).join(" "), text: (g.summary || "").toLowerCase()
    }));
    DB.news.news.forEach(n => push({
      type: "News", id: n.id, title: n.title || n.name, url: "/detail?type=news&id=" + n.id,
      desc: n.summary || n.description || "", badge: n.verification, cat: "News", weight: 1,
      keywords: (n.keywords || []).join(" "), text: (n.summary || n.description || "").toLowerCase()
    }));
    // sites (static pages)
    [["/","Home","Independent GTA VI information and editorial research"],["/faq","FAQ","Official information and research status"],["/pc","Platforms & PC availability","Official platform information and unresolved PC questions"],["/disclaimer","Disclaimer & Credit Policy","Independence, assets, corrections and rights concerns"]].forEach(p => push({
      type: "Page", id: p[0], title: p[1], url: p[0], desc: p[2], badge: null, cat: "Site", weight: .8, keywords: "", text: p[2].toLowerCase()
    }));
  }

  const POPULAR = ["official platforms", "PC availability", "editorial standards", "corrections", "character records", "mission records", "cheat research"];

  function score(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const words = q.split(/\s+/);
    const synWords = words.flatMap(w => (SYN[w] || w).split(" "));
    const all = [...new Set([...words, ...synWords])];
    const seen = new Map();
    const add = (r, s, why) => {
      s = Math.round(s * (r.weight || 1));
      const prev = seen.get(r.url);
      if (!prev || s > prev.s) seen.set(r.url, { r, s, why });
    };
    for (const r of INDEX) {
      const t = r.title.toLowerCase(); const kw = (r.keywords || "").toLowerCase(); const d = (r.desc || "").toLowerCase();
      if (q.length > 8) { // phrase bonus: full multi-word queries that match keywords/description verbatim
        if (t.includes(q)) add(r, 95);
        else if (kw.includes(q)) add(r, 90);
        else if (d.includes(q)) add(r, 85);
      }
      for (const w of all) {
        if (!w) continue;
        if (t === q) add(r, 100, "exact");
        else if (t === w) add(r, 95);
        else if (w.length >= 4 && t.startsWith(w)) add(r, 80);
        else if (t.startsWith(w)) add(r, 60);
        else if (t.includes(w)) add(r, 65);
        else if (kw.split(/\s+/).includes(w)) add(r, 55);
        else if (kw.includes(w)) add(r, 40);
        else if (d.includes(w)) add(r, 40);
        else if (r.text.includes(w)) add(r, 25);
        else if (w.length >= 4) { // typo tolerance
          let best = Infinity; const tWords = (t + " " + kw).split(/\W+/);
          for (const tw of tWords) { if (Math.abs(tw.length - w.length) > 2) continue; const l = LEV(w, tw); if (l < best) best = l; }
          if (best <= (w.length > 6 ? 2 : 1)) add(r, 45 - best * 5, "fuzzy");
        }
      }
    }
    return [...seen.values()].sort((a, b) => b.s - a.s);
  }

  /* ---------------- Search overlay UI ---------------- */
  let sel = -1, flat = [];
  const OVERLAY_ID = "gta-search-overlay";
  function ensureOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    const el = document.createElement("div");
    el.className = "search-overlay"; el.id = OVERLAY_ID;
    el.innerHTML = `
      <div class="search-panel" role="dialog" aria-label="Site search">
        <div class="search-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--faint)"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input id="gta-search-input" type="search" placeholder="Search GTA 6 — cheats, characters, vehicles, missions…" autocomplete="off" aria-label="Search">
          <span class="esc">ESC</span>
        </div>
        <div class="search-body" id="gta-search-body"></div>
        <div class="search-foot">
          <span>↑↓ navigate</span><span>↵ open</span><span>Esc close</span>
          <button type="button" id="gta-search-clear-recents" style="margin-left:auto">Clear recent</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener("mousedown", e => { if (e.target === el) closeSearch(); });
    document.getElementById("gta-search-input").addEventListener("input", e => { sel = -1; runSearch(e.target.value); });
    document.getElementById("gta-search-input").addEventListener("keydown", e => {
      const body = document.getElementById("gta-search-body");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = body.querySelectorAll(".sr-item");
        if (!items.length) return;
        sel = e.key === "ArrowDown" ? (sel + 1) % items.length : (sel - 1 + items.length) % items.length;
        items.forEach((n, i) => n.classList.toggle("sel", i === sel));
        items[sel].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") { e.preventDefault(); const it = body.querySelectorAll(".sr-item")[Math.max(sel, 0)]; if (it) it.click(); }
      else if (e.key === "Escape") closeSearch();
    });
    document.getElementById("gta-search-clear-recents").addEventListener("click", () => { localStorage.removeItem("gta-recents"); runSearch(document.getElementById("gta-search-input").value); });
  }
  function openSearch(prefill) {
    ensureOverlay();
    document.getElementById(OVERLAY_ID).classList.add("open");
    const inp = document.getElementById("gta-search-input");
    inp.value = prefill || ""; sel = -1;
    runSearch(prefill || "");
    setTimeout(() => inp.focus(), 30);
  }
  function closeSearch() { const el = document.getElementById(OVERLAY_ID); if (el) el.classList.remove("open"); }
  function mark(text, q) {
    if (!q) return esc(text);
    const words = [...new Set(q.toLowerCase().split(/\s+/).filter(w => w.length > 1))];
    let out = esc(text);
    words.forEach(w => { out = out.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); });
    return out;
  }
  function runSearch(q) {
    const body = document.getElementById("gta-search-body"); if (!body) return;
    const query = (q || "").trim();
    if (!query) {
      const recents = JSON.parse(localStorage.getItem("gta-recents") || "[]");
      body.innerHTML = `
        <div class="chip-row">${POPULAR.map(p => `<button data-q="${esc(p)}">${esc(p)}</button>`).join("")}</div>
        <div class="search-section">Popular searches</div>
        ${recents.length ? '<div class="search-section" style="margin-top:6px">Recent</div><div class="chip-row">' + recents.map(p => `<button data-q="${esc(p)}">${esc(p)}</button>`).join("") + "</div>" : ""}`;
      body.querySelectorAll(".chip-row button").forEach(b => b.addEventListener("click", () => { document.getElementById("gta-search-input").value = b.dataset.q; sel = -1; runSearch(b.dataset.q); }));
      return;
    }
    const res = score(query).slice(0, 30);
    flat = res.map(x => x.r);
    if (!res.length) {
      body.innerHTML = `<div class="search-empty"><div class="big">🔍</div><b>No matching information found.</b>
        <p class="small" style="margin-top:6px">Try one of these, or <a href="/contact">request a topic</a> and we'll research it.</p>
        <div class="chip-row" style="justify-content:center">${POPULAR.slice(0, 5).map(p => `<button data-q="${esc(p)}">${esc(p)}</button>`).join("")}</div></div>`;
      body.querySelectorAll(".chip-row button").forEach(b => b.addEventListener("click", () => { document.getElementById("gta-search-input").value = b.dataset.q; runSearch(b.dataset.q); }));
      return;
    }
    const groups = {};
    res.forEach(x => { (groups[x.r.type] = groups[x.r.type] || []).push(x); });
    let html = res[0] ? `<div class="search-section">Best match</div>` + row(res[0]) : "";
    Object.entries(groups).forEach(([type, items]) => {
      if (type === "Page" && res[0] && res[0].r.type === "Page") return;
      html += `<div class="search-section">${esc(type)}</div>` + items.slice(0, type === "Cheat code" ? 6 : 4).map(x => row(x)).join("");
    });
    body.innerHTML = html;
    body.querySelectorAll(".sr-item").forEach(n => n.addEventListener("click", () => {
      const recents = JSON.parse(localStorage.getItem("gta-recents") || "[]").filter(r => r !== query); recents.unshift(query);
      localStorage.setItem("gta-recents", JSON.stringify(recents.slice(0, 8)));
      location.href = n.dataset.url;
    }));
    function row(x) {
      return `<div class="sr-item" data-url="${esc(x.r.url)}" role="button" tabindex="0">
        <div><div class="t">${mark(x.r.title, query)}</div><div class="d">${mark((x.r.desc || "").slice(0, 110), query)}</div></div>
        <div class="meta">${esc(x.r.type)}${x.r.badge ? "<br>" + badge(x.r.badge) : ""}</div></div>`;
    }
  }
  function initSearchUI() {
    document.querySelectorAll("[data-search-open]").forEach(b => b.addEventListener("click", () => openSearch(b.dataset.prefill || "")));
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); openSearch(); }
      if (e.key === "Escape") closeSearch();
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
  }

  /* Admin draft preview (authenticated only — RLS blocks drafts for everyone else) */
  async function previewDraft(type, id) {
    try {
      // 1) unsaved editor preview (admin dashboard stashes the payload in sessionStorage)
      const p = sessionStorage.getItem("gta-preview");
      if (p) {
        const row = JSON.parse(p);
        if (row && row.type === type && row.slug === id) {
          const f = row.fields || {};
          return Object.assign({}, f, { id: f.id || row.slug, name: f.name || row.title, verification: row.verification || "SUPPORTED", sources: f.sources || [] });
        }
      }
      // 2) saved draft from the database (requires an authenticated admin session — RLS enforces)
      const client = await sb(); if (!client) return null;
      const { data: sess } = await client.auth.getSession();
      if (!sess || !sess.session) return null;
      const { data, error } = await client.from("content").select("*").eq("type", type).eq("slug", id).maybeSingle();
      if (error || !data) return null;
      return rowToRecord(data);
    } catch (e) { console.warn("preview failed:", e.message); return null; }
  }

  /* Contact submission → database (anon insert allowed by RLS). Rate-limited per session. */
  async function submitContact(entry) {
    if (!SB_ON) return false;
    const last = +sessionStorage.getItem("gta-last-submit") || 0;
    if (Date.now() - last < 30000) return false; // one submission per 30s per session
    try {
      await sbRest("/rest/v1/contact_submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ question: entry.q, category: entry.cat || "Other", email: entry.mail || null })
      });
      sessionStorage.setItem("gta-last-submit", String(Date.now()));
      return true;
    } catch (e) { console.warn("contact submit failed:", e.message); return false; }
  }

  /* Email delivery via the server-side Edge Function. The Resend API key and
     the admin's email address live ONLY in Supabase secrets — nothing secret
     is in this file, the page source, or the network payload beyond the
     visitor's own message. */
  async function notifyByEmail(entry) {
    if (!SB_ON) return false;
    const last = +sessionStorage.getItem("gta-last-email") || 0;
    if (Date.now() - last < 30000) return false; // rate limit shared with DB insert
    try {
      const r = await fetch(SB_URL + "/functions/v1/contact-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ question: entry.q, category: entry.cat || "Other", email: entry.mail || "" })
      });
      if (!r.ok) return false;
      sessionStorage.setItem("gta-last-email", String(Date.now()));
      return true;
    } catch (e) { console.warn("email notify failed:", e.message); return false; }
  }

  /* ---------------- Detail renderer (/detail?type=&id=) ---------------- */
  async function renderDetail(type, id) {
    const root = document.getElementById("detail-root");
    const cfg = {
      cheat:    { title: "Cheat code", back: "/cheats", data: DB.cheats.cheats, nameKey: "name" },
      character:{ title: "Character", back: "/characters", data: DB.characters.characters, nameKey: "name" },
      vehicle:  { title: "Vehicle", back: "/vehicles", data: DB.vehicles.vehicles, nameKey: "name" },
      weapon:   { title: "Weapon", back: "/weapons", data: DB.weapons.weapons, nameKey: "name" },
      location: { title: "Location", back: "/map", data: DB.locations.regions, nameKey: "name" },
      mission:  { title: "Mission", back: "/missions", data: DB.missions.missions, nameKey: "name" },
      guide:    { title: "Guide", back: "/guides", data: DB.guides.guides, nameKey: "name" },
      news:     { title: "News update", back: "/news", data: DB.news.news, nameKey: "name" }
    }[type];
    if (!cfg) { root.innerHTML = emptyState("Unknown content type."); return; }
    if (dataLoadState === "error" || dataLoadState === "unconfigured") { root.innerHTML = unavailableState(); return; }
    let it = cfg.data.find(x => x.id === id);
    if (!it && new URLSearchParams(location.search).get("preview") === "1") {
      // Admin draft preview: authenticated session can read draft rows (RLS-enforced)
      it = await previewDraft(type, id);
      if (!it) { root.innerHTML = emptyState("Draft not found — sign in to the admin dashboard first."); return; }
    }
    if (!it) { root.innerHTML = emptyState("Record not found — it may have been renamed. <a href='" + cfg.back + "'>Browse all " + cfg.title.toLowerCase() + "s</a>."); return; }
    document.title = it.name + " — " + cfg.title + " | OpenWorld Atlas";
    let body = "";
    if (type === "cheat") {
      const catName = { player: "Player", combat: "Combat", vehicle: "Spawn Vehicle", environment: "Environment", filter: "Screen Filter" }[it.category];
      body = `<div class="kv">
        <div>Category</div><div>${esc(catName)} cheat</div>
        <div>Effect</div><div>${esc(it.effect)}</div>
        <div>How to unlock</div><div>${esc(it.unlock)}</div>
        <div>Input</div><div>${inputChips(it.input)}</div>
        <div>Input status</div><div>${it.input && it.input.length ? 'Documented in the sources below' : 'No verified input published'}</div>
        <div>Testing record</div><div>${it.testedPlatform && it.testedVersion && it.testedAt ? esc(it.testedPlatform + " · " + it.testedVersion + " · " + it.testedAt) : '<span class="na">No OpenWorld Atlas test record published</span>'}</div>
      </div>`;
    } else if (type === "character") {
      body = `<div class="kv">
        <div>Type</div><div>${esc(it.type || "Character")}</div>
        <div>Role</div><div>${esc(it.role || "Not confirmed yet")}</div>
        <div>Voice / Mo-cap</div><div>${na(it.voice)}</div>
        <div>First seen</div><div>${na(it.firstMission)}</div>
        <div>Relationships</div><div>${it.relations ? it.relations.map(r => esc(r)).join(" · ") : '<span class="na">Not confirmed yet</span>'}</div>
        <div>Verification</div><div>${badge(it.verification)}</div>
      </div>` + (it.faq ? `<div class="callout good"><b>Common question:</b> ${esc(it.faq)}${it.faqSource ? ` <span class="small">(<a href="${esc(it.faqSource)}" target="_blank" rel="noopener">source</a>)</span>` : ""}</div>` : "");
    } else if (type === "vehicle") {
      body = `<div class="kv">
        <div>Category</div><div>${esc(it.category)}</div>
        <div>Manufacturer</div><div>${na(it.manufacturer)}</div>
        <div>Top speed</div><div>${na(it.topSpeed)}</div>
        <div>Acceleration</div><div>${na(it.acceleration)}</div>
        <div>Braking</div><div>${na(it.braking)}</div>
        <div>Traction</div><div>${na(it.traction)}</div>
        <div>Price</div><div>${na(it.price)}</div>
        <div>How to get</div><div>${esc(it.acquisition || "Not confirmed yet")}</div>
        <div>Verification</div><div>${badge(it.verification)}</div>
      </div><p class="small">Specifications shown as “Not confirmed yet” have no verified public source — we don't fill gaps with guesses.</p>`;
    } else if (type === "weapon") {
      body = `<div class="kv">
        <div>Category</div><div>${esc(it.category)}</div>
        <div>Damage</div><div>${na(it.damage)}</div>
        <div>Accuracy</div><div>${na(it.accuracy)}</div>
        <div>Range</div><div>${na(it.range)}</div>
        <div>Magazine</div><div>${na(it.magazine)}</div>
        <div>How to get</div><div>${esc(it.acquisition || "Not confirmed yet")}</div>
        <div>Customization</div><div>${na(it.customization)}</div>
        <div>Verification</div><div>${badge(it.verification)}</div>
      </div>`;
    } else if (type === "location") {
      body = `<div class="kv">
        <div>Category</div><div>${esc(it.category)}</div>
        <div>Map square</div><div>${na(it.mapSquare)}</div>
        <div>Notable places</div><div>${it.places && it.places.length ? it.places.map(esc).join(" · ") : '<span class="na">Not confirmed yet</span>'}</div>
        <div>Verification</div><div>${badge(it.verification)}</div>
      </div>
      <figure class="shot"><img src="images/region-art.svg" alt="Original schematic artwork — ${esc(it.name)}"><figcaption>Original artwork (not an official map)</figcaption></figure>`;
    } else if (type === "mission") {
      body = `<div class="kv">
        <div>Chapter</div><div>${esc(it.chapter)} — ${esc((DB.missions.chapters.find(c => c.n === it.chapter) || {}).name || "")}</div>
        <div>Type</div><div>${esc(it.type)}</div>
        <div>Objectives</div><div>${it.objectives ? it.objectives.map(esc).join(" · ") : '<span class="na">Not confirmed yet</span>'}</div>
        <div>Verification</div><div>${badge(it.verification)}</div>
      </div>` + (it.choices ? `<h3>The choice</h3><div class="table-wrap"><table><tr><th>Prompt</th><th>Outcome</th></tr>${it.choices.map(c => `<tr><td><b>${esc(c.prompt)}</b></td><td>${esc(c.outcome)}</td></tr>`).join("")}</table></div>` : "") + (it.rewards ? `<div class="callout good"><b>Rewards:</b> ${esc(it.rewards)}</div>` : "");
    } else {
      body = `<div class="kv"><div>Verification</div><div>${badge(it.verification)}</div></div>`;
    }
    const spoiler = it.spoiler || it.details && /SPOILER/.test(it.details || "");
    root.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="${cfg.back}">${cfg.title}s</a> › <span aria-current="page">${esc(it.name)}</span></nav>
      <div class="page-head"><span class="updated">${cfg.title} · ${badge(it.verification)}${it.verifiedAt ? " · Reviewed " + esc(it.verifiedAt) : ""}</span><h1>${esc(it.name)}</h1></div>
      ${spoiler ? '<div class="spoiler">⚠️ <b>Story spoilers below.</b> <button class="spoiler-btn" id="spoiler-toggle">Reveal</button></div><div id="spoiler-zone" class="spoiler hidden-content">' : '<div id="spoiler-zone">'}
      ${type === "cheat" || type === "vehicle" ? "" : ""}
      ${it.summary ? `<p class="lead">${esc(it.summary)}</p>` : ""}
      ${type === "cheat" ? body : ""}
      ${it.details ? `<p>${esc(it.details)}</p>` : ""}
      ${type !== "cheat" ? body : ""}
      </div>
      ${it.correctionNote ? `<div class="callout warn"><b>Correction note:</b> ${esc(it.correctionNote)}</div>` : ""}
      ${srcLine(it.sources)}
      <div class="pager"><a class="btn ghost" href="${cfg.back}">← All ${cfg.title.toLowerCase()}s</a><button class="btn ghost sm" data-search-open data-prefill="${esc(it.name)}">Search related</button></div>`;
    const st = document.getElementById("spoiler-toggle");
    if (st) st.addEventListener("click", () => { document.getElementById("spoiler-zone").classList.toggle("hidden-content"); st.textContent = document.getElementById("spoiler-zone").classList.contains("hidden-content") ? "Reveal" : "Hide"; });
    injectLD(type, it, cfg);
  }
  function injectLD(type, it, cfg) {
    const s = document.createElement("script"); s.type = "application/ld+json";
    s.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": type === "cheat" ? "HowTo" : "Article",
      headline: it.name + " — GTA 6 " + cfg.title, description: it.summary || it.effect || it.description || it.officialText || "",
      author: { "@type": "Organization", name: "OpenWorld Atlas" }, dateModified: new Date().toISOString().slice(0, 10)
    });
    document.head.appendChild(s);
  }

  /* ---------------- List renderers ---------------- */
  function emptyState(msg) { return `<div class="empty"><div class="big">📭</div>${msg || "Nothing published here yet."}</div>`; }
  function unavailableState() { return `<div class="empty"><div class="big">↻</div><b>We couldn't load this information.</b><br>Please try again.<br><button class="btn ghost sm" type="button" onclick="location.reload()">Retry</button></div>`; }
  function cheatRow(c) {
    return `<tr>
      <td><b>${esc(c.name)}</b><br><span class="small">${esc(c.effect)}</span></td>
      <td class="small">${esc(c.unlock)}</td>
      <td>${inputChips(c.input)}</td>
      <td>${badge(c.verification)}</td>
      <td><a class="copy-btn" href="/detail?type=cheat&id=${esc(c.id)}">Details</a></td>
    </tr>`;
  }
  function renderCheatDirectory() {
    const root = document.getElementById("cheat-root"); if (!root) return;
    if (dataLoadState === "error" || dataLoadState === "unconfigured") { root.innerHTML = unavailableState(); return; }
    const state = { q: "", cat: "all", sort: "az" };
    const CATS = [["all","All categories"],["player","Player"],["combat","Combat"],["vehicle","Spawn Vehicle"],["environment","Environment"],["filter","Screen Filter"]];
    root.innerHTML = `
      <div class="toolbar">
        <input id="cq" type="search" placeholder="Filter ${DB.cheats.cheats.length} cheats — name, effect or keyword…" aria-label="Filter cheats">
        <select id="ccat" aria-label="Category">${CATS.map(c => `<option value="${c[0]}">${c[1]}</option>`).join("")}</select>
        <select id="csort" aria-label="Sort"><option value="az">A–Z</option><option value="cat">By category</option><option value="verified">Verified inputs first</option></select>
        <span class="count" id="ccount"></span>
      </div>
      <div class="callout warn"><b>Research notice:</b> This directory only displays entries approved for publication. Check each entry's source and platform notes before relying on it.</div>
      <div class="table-wrap"><table><thead><tr><th>Cheat</th><th>Claim</th><th>Input</th><th>Verification</th><th></th></tr></thead><tbody id="cbody"></tbody></table></div>
      <p class="small">A code is shown only after it has passed editorial review. “Reported” does not mean tested by OpenWorld Atlas. See the <a href="/editorial-standards">Editorial Standards</a>.</p>`;
    const apply = () => {
      let rows = DB.cheats.cheats.filter(c =>
        (state.cat === "all" || c.category === state.cat) &&
        (!state.q || (c.name + " " + c.effect + " " + c.unlock + " " + (c.keywords || []).join(" ")).toLowerCase().includes(state.q)));
      if (state.sort === "az") rows.sort((a, b) => a.name.localeCompare(b.name));
      if (state.sort === "cat") rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      if (state.sort === "verified") rows.sort((a, b) => (b.input ? 1 : 0) - (a.input ? 1 : 0));
      document.getElementById("cbody").innerHTML = rows.map(cheatRow).join("") || `<tr><td colspan="5">${emptyState("No cheat matches that filter.")}</td></tr>`;
      document.getElementById("ccount").textContent = rows.length + " of " + DB.cheats.cheats.length;
    };
    document.getElementById("cq").addEventListener("input", e => { state.q = e.target.value.toLowerCase(); apply(); });
    document.getElementById("ccat").addEventListener("change", e => { state.cat = e.target.value; apply(); });
    document.getElementById("csort").addEventListener("change", e => { state.sort = e.target.value; apply(); });
    apply();
    // how-to block
    const how = document.getElementById("cheat-howto");
    if (how) how.innerHTML = `<ol class="steps">${DB.cheats.howTo.map(h => `<li>${esc(h)}</li>`).join("")}</ol>`;
  }
  function entityCard(type, it, url) {
    const media = {
      Character: ["images/editorial/character-illustration.png", "Illustrative anonymous profile artwork"],
      Vehicle: ["images/editorial/vehicle-editorial.png", "Illustrative unbranded vehicle editorial image"],
      Weapon: ["images/editorial/equipment-still-life.png", "Illustrative generic equipment still life"],
      Location: ["images/editorial/location-marina.png", "Illustrative coastal environment"],
      Mission: ["images/editorial/mission-waterfront.png", "Illustrative nighttime waterfront environment"],
      Guide: ["images/editorial/guide-map-desk.png", "Illustrative map and guide desk scene"]
    }[type];
    return `<a class="card entity-card" href="${url}">
      ${media ? `<img class="entity-image" src="${esc(it.imageUrl || media[0])}" alt="${esc(it.imageAlt || media[1])}" loading="lazy" width="1448" height="1086" onerror="this.onerror=null;this.src='${media[0]}'">` : `<span class="entity-art art-${type.toLowerCase().replace(/\s+/g, "-")}" aria-hidden="true"></span>`}
      <span class="badge ${["OFFICIALLY_CONFIRMED", "INDEPENDENTLY_VERIFIED"].includes(it.verification) ? "confirmed" : ["REPORTED", "UNCONFIRMED", "SPECULATION"].includes(it.verification) ? "unconfirmed" : "unavailable"}">${esc((it.verification || "UNKNOWN").replace(/_/g, " ").toLowerCase())}</span>
      <div class="t">${esc(it.name || it.title)}</div><div class="d">${esc((it.summary || it.effect || it.description || it.officialText || "").slice(0, 130))}</div>
      <div class="more" style="margin-top:10px;color:var(--accent)">${type} details →</div></a>`;
  }
  function renderEntityGrid(containerSel, items, type, urlFn) {
    const root = document.querySelector(containerSel); if (!root) return;
    root.innerHTML = dataLoadState === "error" || dataLoadState === "unconfigured" ? unavailableState() : (items.map(it => entityCard(type, it, urlFn(it))).join("") || emptyState("No published " + type.toLowerCase() + " records are available yet."));
  }
  function renderNews() {
    const root = document.getElementById("news-root"); if (!root) return;
    const dbNews = DB.news && DB.news.news;
    const items = dbNews && dbNews.length ? dbNews.map(n => ({
      d: n.date || "", t: n.title || n.name, s: n.verification || "SUPPORTED", x: n.summary || n.effect || "", u: n.url || ("/detail?type=news&id=" + n.id)
    })) : [];
    if (dataLoadState === "error" || dataLoadState === "unconfigured") { root.innerHTML = unavailableState(); return; }
    if (!items.length) { root.innerHTML = emptyState("No published news updates are available yet. Check back after editorial review."); return; }
    root.innerHTML = items.map(i => `<div class="card"><span class="badge ${["OFFICIALLY_CONFIRMED", "INDEPENDENTLY_VERIFIED"].includes(i.s) ? "confirmed" : ["REPORTED", "UNCONFIRMED", "SPECULATION"].includes(i.s) ? "unconfirmed" : "unavailable"}">${esc((i.s || "UNKNOWN").replace(/_/g, " ").toLowerCase())}</span>
      <div class="t" style="font-weight:700;margin:6px 0">${esc(i.t)}</div><div class="small">${esc(i.d)} — ${esc(i.x)}</div>
      <div class="srcline"><a href="${esc(i.u)}">Read update →</a></div></div>`).join("");
  }
  function contentRequestForm() {
    const f = document.getElementById("request-form"); if (!f) return;
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const q = f.querySelector("[name=question]"), cat = f.querySelector("[name=category]"), mail = f.querySelector("[name=email]");
      let ok = true;
      f.querySelectorAll(".err").forEach(x => x.classList.remove("show"));
      if (!q.value.trim() || q.value.trim().length < 8) { q.nextElementSibling.classList.add("show"); ok = false; }
      if (!ok) return;
      const entry = { q: q.value.trim(), cat: cat.value, mail: mail.value.trim(), at: new Date().toISOString() };
      const button = f.querySelector("button[type=submit]");
      const okBox = f.querySelector(".form-ok");
      button.disabled = true; button.textContent = "Sending…"; okBox.classList.remove("show");
      const saved = window.GTA && window.GTA.submitContact ? await window.GTA.submitContact(entry) : false;
      button.disabled = false; button.textContent = "Submit request";
      if (!saved) {
        okBox.textContent = "We couldn’t submit your request right now. Please try again later.";
        okBox.classList.add("show");
        return;
      }
      f.reset();
      okBox.innerHTML = "✅ <b>Received.</b> Your request has been securely recorded. Email replies require the notification service to be configured.";
      okBox.classList.add("show");
      if (window.GTA && window.GTA.notifyByEmail) window.GTA.notifyByEmail(entry);
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("a.logo").forEach(logo => {
      const href = logo.getAttribute("href") || "/";
      const asset = href.includes("../") ? "../images/openworld-atlas-mark.svg" : "images/openworld-atlas-mark.svg";
      logo.setAttribute("aria-label", SITE.name + " — " + SITE.tagline);
      logo.innerHTML = '<img src="' + asset + '" alt="" class="logo-mark"> <span>OPENWORLD <b>ATLAS</b></span>';
    });
    const mt = document.querySelector(".menu-toggle"), mm = document.querySelector(".mobile-menu");
    if (mt && mm) mt.addEventListener("click", () => mm.classList.toggle("open"));
    initSearchUI();
    const rp = document.querySelector(".progress");
    if (rp) { const up = () => { const h = document.documentElement; rp.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%"; }; document.addEventListener("scroll", up, { passive: true }); up(); }
    contentRequestForm();
    window.GTA.READY.then(() => { buildIndex(); document.dispatchEvent(new CustomEvent("gta:index-ready")); });
    // page renderers
    const params = new URLSearchParams(location.search);
    if (document.getElementById("detail-root")) { READY.then(() => renderDetail(params.get("type"), params.get("id"))); }
    if (document.getElementById("cheat-root")) READY.then(renderCheatDirectory);
    if (document.getElementById("news-root")) READY.then(renderNews);
    if (document.getElementById("chars-root")) READY.then(() => renderEntityGrid("#chars-root", DB.characters.characters, "Character", c => "/detail?type=character&id=" + c.id));
    if (document.getElementById("vehicles-root")) READY.then(() => renderEntityGrid("#vehicles-root", DB.vehicles.vehicles, "Vehicle", v => "/detail?type=vehicle&id=" + v.id));
    if (document.getElementById("weapons-root")) READY.then(() => renderEntityGrid("#weapons-root", DB.weapons.weapons, "Weapon", w => "/detail?type=weapon&id=" + w.id));
    if (document.getElementById("locations-root")) READY.then(() => renderEntityGrid("#locations-root", DB.locations.regions, "Location", l => "/detail?type=location&id=" + l.id));
    if (document.getElementById("missions-root")) READY.then(() => renderEntityGrid("#missions-root", DB.missions.missions, "Mission", m => "/detail?type=mission&id=" + m.id));
    if (document.getElementById("guides-root")) READY.then(() => renderEntityGrid("#guides-root", DB.guides.guides, "Guide", g => "/detail?type=guide&id=" + g.id));
    // interactive map schematic: click/keyboard a region → its detail page
    document.querySelectorAll(".map-stage .region[data-href], .map-schematic .region[data-href]").forEach(g => {
      g.classList.add("clickable");
      g.addEventListener("click", () => { location.href = g.dataset.href; });
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); location.href = g.dataset.href; } });
      g.setAttribute("tabindex", "0"); g.setAttribute("role", "link");
    });
    // homepage dynamic sections
    if (document.getElementById("home-cheats")) READY.then(() => {
      const root = document.getElementById("home-cheats");
      if (dataLoadState === "error" || dataLoadState === "unconfigured") { root.innerHTML = unavailableState(); return; }
      const top = DB.cheats.cheats.slice(0, 5);
      root.innerHTML = top.map(c => `<div class="card"><span class="badge ${["OFFICIALLY_CONFIRMED", "INDEPENDENTLY_VERIFIED"].includes(c.verification) ? "confirmed" : "unconfirmed"}">${esc((c.verification || "UNKNOWN").replace(/_/g, " ").toLowerCase())}</span><div class="t" style="font-weight:700;margin:6px 0">${esc(c.name)}</div><div class="small">${esc(c.effect || c.summary || "")}</div><a class="small" href="/detail?type=cheat&id=${esc(c.id)}">Details →</a></div>`).join("") || emptyState("No published cheat-code records are available yet.");
    });
    if (document.getElementById("home-chars")) READY.then(() => renderEntityGrid("#home-chars", DB.characters.characters.slice(0, 3), "Character", c => "/detail?type=character&id=" + c.id));
  });
  window.GTA = { DB, READY, openSearch, score, esc, badge, na, serverSearch, submitContact, notifyByEmail, SB_ON, sb };
})();
