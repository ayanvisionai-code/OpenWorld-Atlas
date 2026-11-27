GTA.READY.then(() => {
    const inp = document.getElementById("page-search"), out = document.getElementById("page-results"), count = document.getElementById("search-count");
    const q0 = new URLSearchParams(location.search).get("q");
    if (q0) inp.value = q0;
    const card = x => `<a class="card entity-card" href="${GTA.esc(x.r.url)}"><span class="badge ${x.r.badge === "CONFIRMED" ? "confirmed" : x.r.badge === "UNCONFIRMED" ? "unconfirmed" : "confirmed"}">${GTA.esc(x.r.type)}</span><div class="t">${GTA.esc(x.r.title)}</div><div class="d">${GTA.esc((x.r.desc || "").slice(0, 140))}</div></a>`;
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
