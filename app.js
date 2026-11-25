/* GTA VI HQ — app runtime: data store, search engine, renderers */
(function () {
  "use strict";

  /* ---------------- Data store ---------------- */
  const DB = { cheats: null, characters: null, vehicles: null, weapons: null, locations: null, missions: null, guides: null };
  const DATA_VER = "2026-11-25c"; // bump when data/*.json changes so browsers refetch
  const READY = Promise.all(
    Object.keys(DB).map(k =>
      fetch("data/" + k + ".json?v=" + DATA_VER, { cache: "reload" }).then(r => { if (!r.ok) throw new Error(k); return r.json(); }).then(j => { DB[k] = j; })
    )
  );

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const badge = st => {
    if (st === "CONFIRMED") return '<span class="badge confirmed">● Confirmed</span>';
    if (st === "SUPPORTED") return '<span class="badge confirmed">● Supported</span>';
    if (st === "UNCONFIRMED") return '<span class="badge unconfirmed">● Unconfirmed</span>';
    if (st === "SPECULATION") return '<span class="badge speculation">● Speculation</span>';
    return '<span class="badge unavailable">● Not available</span>';
  };
  const na = v => (v == null || v === "" ? '<span class="na">Not confirmed yet</span>' : esc(v));
  const inputChips = arr => arr ? '<div class="cheat">' + arr.map(d => `<span>${esc(d)}</span>`).join("") + "</div>" : '<span class="na">Input not yet discovered</span>';
  const srcLine = arr => arr && arr.length ? '<div class="srcline"><b>Sources:</b> ' + arr.map(u => `<a href="${esc(u)}" rel="noopener" target="_blank">${esc(new URL(u).hostname.replace("www.",""))}</a>`).join(" · ") + "</div>" : "";
  const LEV = (a, b) => { a = a || ""; b = b || ""; if (!a.length) return b.length; if (!b.length) return a.length; let v0 = [], v1 = new Array(b.length + 1); for (let j = 0; j <= b.length; j++) v0[j] = j; for (let i = 1; i <= a.length; i++) { v1[0] = i; for (let j = 1; j <= b.length; j++) { const cost = a[i-1] === b[j-1] ? 0 : 1; v1[j] = Math.min(v1[j-1] + 1, v0[j] + 1, v0[j-1] + cost); } [v0, v1] = [v1, v0]; } return v0[b.length]; };

  /* ---------------- Search index ---------------- */
  const SYN = { gta:"gta", vi:"gta", money:"cash dollars rich", car:"vehicle auto", cheat:"cheats codes", map:"leonida world", pc:"computer steam windows", online:"multiplayer", trans:"gender lucia rumor", jason:"protagonist", lucia:"protagonist", jet:"plane aircraft lazer", gun:"weapon", weapon:"gun", tank:"military vehicle", helicopter:"chopper aircraft", ending:"finale final mission", length:"hours long beat", price:"cost dollars", review:"metacritic score rating", sales:"copies revenue record" };
  let INDEX = [];
  function buildIndex() {
    INDEX = [];
    const push = o => INDEX.push(o);
    // cheats
    DB.cheats.cheats.forEach(c => push({
      type: "Cheat code", id: c.id, title: c.name + " cheat", url: "detail.html?type=cheat&id=" + c.id,
      desc: c.effect, badge: c.inputStatus === "CONFIRMED" ? "CONFIRMED" : "UNAVAILABLE",
      cat: "Cheat — " + c.category, weight: 1.15,
      keywords: (c.keywords || []).join(" "), text: (c.effect + " " + c.unlock).toLowerCase()
    }));
    // characters
    DB.characters.characters.forEach(c => push({
      type: "Character", id: c.id, title: c.name, url: "detail.html?type=character&id=" + c.id,
      desc: c.summary || (c.details || "").slice(0, 130), badge: c.verification, cat: c.type || "Character", weight: 1.1,
      keywords: (c.keywords || []).join(" ") + " " + (c.voice || ""), text: (c.details || "").toLowerCase()
    }));
    // vehicles
    DB.vehicles.vehicles.forEach(v => push({
      type: "Vehicle", id: v.id, title: v.name, url: "detail.html?type=vehicle&id=" + v.id,
      desc: v.description || "", badge: v.verification, cat: v.category, weight: 1,
      keywords: (v.keywords || []).join(" ") + " " + (v.manufacturer || ""), text: (v.description + " " + (v.acquisition || "")).toLowerCase()
    }));
    // weapons
    DB.weapons.weapons.forEach(w => push({
      type: "Weapon", id: w.id, title: w.name, url: "detail.html?type=weapon&id=" + w.id,
      desc: w.description || "", badge: w.verification, cat: w.category, weight: 1,
      keywords: (w.keywords || []).join(" "), text: (w.description + " " + (w.acquisition || "")).toLowerCase()
    }));
    // locations
    DB.locations.regions.forEach(l => push({
      type: "Location", id: l.id, title: l.name, url: "detail.html?type=location&id=" + l.id,
      desc: l.officialText, badge: l.verification, cat: l.category, weight: 1.05,
      keywords: (l.keywords || []).join(" "), text: ((l.officialText || "") + " " + (l.places || []).join(" ")).toLowerCase()
    }));
    // missions
    DB.missions.missions.forEach(m => push({
      type: "Mission", id: m.id, title: m.name, url: "detail.html?type=mission&id=" + m.id,
      desc: (m.summary || "").slice(0, 140), badge: m.verification, cat: "Chapter " + m.chapter, weight: 1,
      keywords: (m.keywords || []).join(" "), text: (m.summary + " " + JSON.stringify(m.objectives || [])).toLowerCase()
    }));
    // guides
    DB.guides.guides.forEach(g => push({
      type: "Guide", id: g.id, title: g.title, url: g.url, desc: g.summary, badge: g.verification,
      cat: g.category, weight: 1, keywords: (g.keywords || []).join(" "), text: (g.summary || "").toLowerCase()
    }));
    // sites (static pages)
    [["index.html","Home","Everything about GTA 6 — the fact-checked guide hub",""],["faq.html","FAQ","Every GTA 6 question, answered with sources"],["pc.html","PC, Platforms & Price","GTA 6 on PC, console prices, editions, GTA Online"],["disclaimer.html","Disclaimer & Credit Policy","Legal safeguards, attribution and takedown contact"]].forEach(p => push({
      type: "Page", id: p[0], title: p[1], url: p[0], desc: p[2], badge: null, cat: "Site", weight: .8, keywords: "", text: p[2].toLowerCase()
    }));
  }

  const POPULAR = ["money cheat", "cheat codes", "jason and lucia", "mandy", "map size", "niko bellic", "pc release", "ending", "how long is gta 6"];

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
        <p class="small" style="margin-top:6px">Try one of these, or <a href="contact.html">request a topic</a> and we'll research it.</p>
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

  /* ---------------- Detail renderer (detail.html?type=&id=) ---------------- */
  function renderDetail(type, id) {
    const root = document.getElementById("detail-root");
    const cfg = {
      cheat:    { title: "Cheat code", back: "cheats.html", data: DB.cheats.cheats, nameKey: "name" },
      character:{ title: "Character", back: "characters.html", data: DB.characters.characters, nameKey: "name" },
      vehicle:  { title: "Vehicle", back: "vehicles.html", data: DB.vehicles.vehicles, nameKey: "name" },
      weapon:   { title: "Weapon", back: "weapons.html", data: DB.weapons.weapons, nameKey: "name" },
      location: { title: "Location", back: "locations.html", data: DB.locations.regions, nameKey: "name" },
      mission:  { title: "Mission", back: "missions.html", data: DB.missions.missions, nameKey: "name" }
    }[type];
    if (!cfg) { root.innerHTML = emptyState("Unknown content type."); return; }
    const it = cfg.data.find(x => x.id === id);
    if (!it) { root.innerHTML = emptyState("Record not found — it may have been renamed. <a href='" + cfg.back + "'>Browse all " + cfg.title.toLowerCase() + "s</a>."); return; }
    document.title = it.name + " — GTA 6 " + cfg.title + " | GTA VI HQ";
    let body = "";
    if (type === "cheat") {
      const catName = { player: "Player", combat: "Combat", vehicle: "Spawn Vehicle", environment: "Environment", filter: "Screen Filter" }[it.category];
      body = `<div class="kv">
        <div>Category</div><div>${esc(catName)} cheat</div>
        <div>Effect</div><div>${esc(it.effect)}</div>
        <div>How to unlock</div><div>${esc(it.unlock)}</div>
        <div>Input</div><div>${inputChips(it.input)}</div>
        <div>Input status</div><div>${badge(it.inputStatus === "CONFIRMED" ? "CONFIRMED" : "NOT AVAILABLE")} ${it.inputStatus === "CONFIRMED" ? '<span class="small">— input documented by <a href="https://www.powerpyx.com/gta-6-all-cheats/" target="_blank" rel="noopener">PowerPyx</a>' : '<span class="small">— effect & unlock confirmed; no working input published yet. We do not print unverified inputs.</span>'}</div>
        <div>Platforms</div><div>PlayStation 5 · Xbox Series X|S</div>
        <div>Reminder</div><div>Works only after finishing the story. Any cheat disables saving &amp; trophies for that session.</div>
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
    }
    const spoiler = it.spoiler || it.details && /SPOILER/.test(it.details || "");
    root.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> › <a href="${cfg.back}">${cfg.title}s</a> › <span aria-current="page">${esc(it.name)}</span></nav>
      <div class="page-head"><span class="updated">${cfg.title} · ${badge(it.verification)} · Last verified Nov 25, 2026</span><h1>${esc(it.name)}</h1></div>
      ${spoiler ? '<div class="spoiler">⚠️ <b>Story spoilers below.</b> <button class="spoiler-btn" id="spoiler-toggle">Reveal</button></div><div id="spoiler-zone" class="spoiler hidden-content">' : '<div id="spoiler-zone">'}
      ${type === "cheat" || type === "vehicle" ? "" : ""}
      ${it.summary ? `<p class="lead">${esc(it.summary)}</p>` : ""}
      ${type === "cheat" ? body : ""}
      ${it.details ? `<p>${esc(it.details)}</p>` : ""}
      ${type !== "cheat" ? body : ""}
      </div>
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
      author: { "@type": "Organization", name: "GTA VI HQ" }, dateModified: "2026-11-25"
    });
    document.head.appendChild(s);
  }

  /* ---------------- List renderers ---------------- */
  function emptyState(msg) { return `<div class="empty"><div class="big">📭</div>${msg || "Nothing here yet."}</div>`; }
  function cheatRow(c) {
    return `<tr>
      <td><b>${esc(c.name)}</b>${c.id === "money-250k" ? ' <span class="tag pink" style="margin-left:6px">Most searched</span>' : ""}<br><span class="small">${esc(c.effect)}</span></td>
      <td class="small">${esc(c.unlock)}</td>
      <td>${inputChips(c.input)}</td>
      <td>${badge(c.inputStatus === "CONFIRMED" ? "CONFIRMED" : "NOT AVAILABLE")}</td>
      <td><a class="copy-btn" href="detail.html?type=cheat&id=${esc(c.id)}">Details</a></td>
    </tr>`;
  }
  function renderCheatDirectory() {
    const root = document.getElementById("cheat-root"); if (!root) return;
    const state = { q: "", cat: "all", sort: "az" };
    const CATS = [["all","All categories"],["player","Player"],["combat","Combat"],["vehicle","Spawn Vehicle"],["environment","Environment"],["filter","Screen Filter"]];
    root.innerHTML = `
      <div class="toolbar">
        <input id="cq" type="search" placeholder="Filter ${DB.cheats.cheats.length} cheats — name, effect or keyword…" aria-label="Filter cheats">
        <select id="ccat" aria-label="Category">${CATS.map(c => `<option value="${c[0]}">${c[1]}</option>`).join("")}</select>
        <select id="csort" aria-label="Sort"><option value="az">A–Z</option><option value="cat">By category</option><option value="verified">Verified inputs first</option></select>
        <span class="count" id="ccount"></span>
      </div>
      <div class="callout warn"><b>Save warning:</b> entering any cheat disables saving and trophies for the rest of that session. Cheats only work after finishing the story.</div>
      <div class="table-wrap"><table><thead><tr><th>Cheat</th><th>Unlock condition</th><th>Input (D-pad)</th><th>Input status</th><th></th></tr></thead><tbody id="cbody"></tbody></table></div>
      <p class="small">“Confirmed” = the exact input is documented by <a href="https://www.powerpyx.com/gta-6-all-cheats/" target="_blank" rel="noopener">PowerPyx's complete GTA 6 cheat guide</a> — the primary source other major outlets credit. “Not available” = the cheat, effect and unlock are confirmed but no working input has been published yet. We never print unverified inputs. <a href="disclaimer.html">Full policy</a>.</p>`;
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
    return `<a class="card entity-card" href="${url}">
      <span class="badge ${it.verification === "CONFIRMED" ? "confirmed" : it.verification === "UNCONFIRMED" ? "unconfirmed" : "unavailable"}">${(it.verification || "").toLowerCase()}</span>
      <div class="t">${esc(it.name || it.title)}</div><div class="d">${esc((it.summary || it.effect || it.description || it.officialText || "").slice(0, 130))}</div>
      <div class="more" style="margin-top:10px;color:var(--accent)">${type} details →</div></a>`;
  }
  function renderEntityGrid(containerSel, items, type, urlFn) {
    const root = document.querySelector(containerSel); if (!root) return;
    root.innerHTML = items.map(it => entityCard(type, it, urlFn(it))).join("") || emptyState();
  }
  function renderNews() {
    const root = document.getElementById("news-root"); if (!root) return;
    const items = [
      { d: "Nov 24, 2026", t: "Launch-weekend estimate: 44.9M copies, ~$4B gross", s: "SUPPORTED", x: "Alinea Analytics estimates GTA 6 sold 44.9 million copies with ~$4 billion gross by the end of launch weekend — twice Taylor Swift's entire Eras Tour take.", u: "https://www.polygon.com/gta-6-grand-theft-auto-first-weekend-sales/" },
      { d: "Nov 20, 2026", t: "Official: $3.79B day-one retail sales, 32.5M units pre-release", s: "CONFIRMED", x: "Take-Two's press release confirms the biggest entertainment launch in history across any medium.", u: "https://taketwointeractivesoftwareinc.gcs-web.com/news-releases/news-release-details/grand-theft-auto-vi-shatters-entertainment-box-office-records/" },
      { d: "Nov 18, 2026", t: "Metacritic 99 — highest-rated game of all time", s: "CONFIRMED", x: "99 on both PS5 and Xbox Series X from 150+ critic reviews, above Ocarina of Time; OpenCritic 98; user score ~5.7.", u: "https://www.metacritic.com/game/grand-theft-auto-vi/" },
      { d: "Nov 19, 2026", t: "GTA 6 out now on PS5 & Xbox Series X|S", s: "CONFIRMED", x: "Released at midnight local time. No PC version announced; Xbox One via cloud only. Pre-load ran from Nov 12.", u: "https://www.rockstargames.com/VI/out-now" },
      { d: "Nov 19, 2026", t: "Full credits published — cast revealed", s: "CONFIRMED", x: "Dylan Rourke as Jason, Manni L. Perez as Lucia, Lexie Shoaibi as Mandy; Michael Hollick credited as 'The Hitman'.", u: "https://www.polygon.com/gta-6-cast-list-actors-cameos-grand-theft-auto/" },
      { d: "Ongoing", t: "Cheat inputs still being discovered (15 of 61 known)", s: "UNCONFIRMED", x: "PowerPyx's list is the primary source; we update our database as inputs are verified. No unlimited-money cheat exists.", u: "https://www.powerpyx.com/gta-6-all-cheats/" }
    ];
    root.innerHTML = items.map(i => `<div class="card"><span class="badge ${i.s === "CONFIRMED" ? "confirmed" : i.s === "SUPPORTED" ? "confirmed" : "unconfirmed"}">${i.s.toLowerCase()}</span>
      <div class="t" style="font-weight:700;margin:6px 0">${esc(i.t)}</div><div class="small">${esc(i.d)} — ${esc(i.x)}</div>
      <div class="srcline"><a href="${esc(i.u)}" target="_blank" rel="noopener">Source ↗</a></div></div>`).join("");
  }
  function contentRequestForm() {
    const f = document.getElementById("request-form"); if (!f) return;
    f.addEventListener("submit", e => {
      e.preventDefault();
      const q = f.querySelector("[name=question]"), cat = f.querySelector("[name=category]"), mail = f.querySelector("[name=email]");
      let ok = true;
      f.querySelectorAll(".err").forEach(x => x.classList.remove("show"));
      if (!q.value.trim() || q.value.trim().length < 8) { q.nextElementSibling.classList.add("show"); ok = false; }
      if (!ok) return;
      const store = JSON.parse(localStorage.getItem("gta-requests") || "[]");
      store.push({ q: q.value.trim(), cat: cat.value, mail: mail.value.trim(), at: new Date().toISOString() });
      localStorage.setItem("gta-requests", JSON.stringify(store));
      f.querySelector(".form-ok").classList.add("show");
      f.reset();
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
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
    if (document.getElementById("chars-root")) READY.then(() => renderEntityGrid("#chars-root", DB.characters.characters, "Character", c => "detail.html?type=character&id=" + c.id));
    if (document.getElementById("vehicles-root")) READY.then(() => renderEntityGrid("#vehicles-root", DB.vehicles.vehicles, "Vehicle", v => "detail.html?type=vehicle&id=" + v.id));
    if (document.getElementById("weapons-root")) READY.then(() => renderEntityGrid("#weapons-root", DB.weapons.weapons, "Weapon", w => "detail.html?type=weapon&id=" + w.id));
    if (document.getElementById("locations-root")) READY.then(() => renderEntityGrid("#locations-root", DB.locations.regions, "Location", l => "detail.html?type=location&id=" + l.id));
    if (document.getElementById("missions-root")) READY.then(() => renderEntityGrid("#missions-root", DB.missions.missions, "Mission", m => "detail.html?type=mission&id=" + m.id));
    if (document.getElementById("guides-root")) READY.then(() => renderEntityGrid("#guides-root", DB.guides.guides, "Guide", g => g.url));
    // interactive map schematic: click/keyboard a region → its detail page
    document.querySelectorAll(".map-stage .region[data-href], .map-schematic .region[data-href]").forEach(g => {
      g.classList.add("clickable");
      g.addEventListener("click", () => { location.href = g.dataset.href; });
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); location.href = g.dataset.href; } });
      g.setAttribute("tabindex", "0"); g.setAttribute("role", "link");
    });
    // homepage dynamic sections
    if (document.getElementById("home-cheats")) READY.then(() => {
      const top = DB.cheats.cheats.filter(c => c.input).slice(0, 5);
      document.getElementById("home-cheats").innerHTML = top.map(c => `<div class="card"><span class="badge confirmed">input confirmed</span><div class="t" style="font-weight:700;margin:6px 0">${esc(c.name)}</div><div class="cheat">${c.input.map(d => `<span>${esc(d)}</span>`).join("")}</div><a class="small" href="detail.html?type=cheat&id=${esc(c.id)}">Details →</a></div>`).join("");
    });
    if (document.getElementById("home-chars")) READY.then(() => renderEntityGrid("#home-chars", DB.characters.characters.filter(c => ["jason-duval","lucia-caminos","mandy","niko-bellic","boobie-ike"].includes(c.id)), "Character", c => "detail.html?type=character&id=" + c.id));
  });
  window.GTA = { DB, READY, openSearch, score, esc, badge, na };
})();
