GTA.READY.then(() => {
    const inp = document.getElementById("page-search"), out = document.getElementById("page-results"), count = document.getElementById("search-count");
    const q0 = new URLSearchParams(location.search).get("q");
    if (q0) inp.value = q0;
    const card = ({ r }) => `<a class="card entity-card record-tile" href="${GTA.esc(r.url)}">
      <small class="record-kind">${GTA.esc(r.type)}</small>
      ${r.badge === "ARCHIVED_REPORT" ? GTA.badge(r.badge) : ""}
      <div class="t">${GTA.esc(r.title)}</div><div class="d">${GTA.esc((r.desc || "").slice(0, 140))}</div></a>`;
    const render = res => {
      count.textContent = inp.value.trim() ? res.length + " results" : "";
      if (!inp.value.trim()) { out.innerHTML = '<div class="empty"><div class="big">🔍</div>Type above, or press <code>/</code> anywhere on the site.</div>'; return; }
      if (!res.length) { out.innerHTML = '<div class="empty"><div class="big">📭</div><b>No matching information found.</b><br><a href="/contact">Request this topic →</a></div>'; return; }
      out.innerHTML = '<div class="grid g2">' + res.slice(0, 40).map(card).join("") + "</div>";
    };
    const run = () => render(GTA.score(inp.value.trim()).slice(0, 40));
    let t; inp.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 250); });
    run();
  });
