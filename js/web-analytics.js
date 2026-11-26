// Loaded only by public pages in the production build.
(() => {
  if (new URLSearchParams(location.search).has("preview")) return;
  window.vaq = window.vaq || [];
  window.vaq.push(["beforeSend", event => {
    const url = new URL(event.url, location.origin);
    return { ...event, url: url.origin + url.pathname };
  }]);
  const script = document.createElement("script");
  script.src = "/_vercel/insights/script.js";
  document.head.append(script);
})();
