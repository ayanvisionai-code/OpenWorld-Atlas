// OpenWorld Atlas — Audience Measurement & Privacy-Preserving Analytics
// Supports Vercel Web Analytics and Google Analytics 4 (G-FEDMCV24K7) with Google Basic Consent Mode.
(() => {
  const GA_ID = "G-FEDMCV24K7";
  const PROD_HOST = "www.openworldatlas.online";
  const STORAGE_KEY = "owa_ga_consent"; // 'granted' | 'denied'

  // 1. Scope & Environment Exclusions
  const path = location.pathname.toLowerCase();
  const search = location.search;
  const isPreview = new URLSearchParams(search).has("preview");
  const isAdmin = path === "/admin.html" || path.startsWith("/admin");
  if (isAdmin || isPreview) return;

  const isProduction = location.hostname === PROD_HOST;

  // 2. Existing Vercel Web Analytics (Preserved)
  window.vaq = window.vaq || [];
  window.vaq.push(["beforeSend", event => {
    const clean = new URL(event.url, location.origin);
    return { ...event, url: clean.origin + clean.pathname };
  }]);
  const vercelScript = document.createElement("script");
  vercelScript.src = "/_vercel/insights/script.js";
  vercelScript.defer = true;
  document.head.append(vercelScript);

  // 3. Storage & Cookie Helpers
  function getConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function setConsent(val) {
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch (_) {}
  }

  function clearGaCookies() {
    const host = location.hostname;
    const parts = host.split(".");
    const domains = ["", host, "." + host];
    if (parts.length >= 2) {
      domains.push("." + parts.slice(-2).join("."));
    }
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
      const name = c.split("=")[0].trim();
      if (name === "_ga" || name.startsWith("_ga_") || name.startsWith("_gid")) {
        for (let d of domains) {
          const domAttr = d ? `; domain=${d}` : "";
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domAttr}`;
        }
      }
    }
  }

  function getSanitizedUrl() {
    return location.origin + location.pathname;
  }

  // 4. Google Basic Consent Mode Setup (Disabled by Default)
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  gtag("set", "allow_google_signals", false);
  gtag("set", "allow_ad_personalization_signals", false);
  gtag("set", "restricted_data_processing", true);

  let gaScriptLoaded = false;

  function activateGa() {
    if (!isProduction || gaScriptLoaded) return;
    gaScriptLoaded = true;

    gtag("consent", "update", {
      analytics_storage: "granted"
    });

    gtag("js", new Date());
    gtag("config", GA_ID, {
      send_page_view: false,
      page_location: getSanitizedUrl(),
      page_referrer: document.referrer ? new URL(document.referrer, location.origin).origin : "",
      anonymize_ip: true
    });
    gtag("event", "page_view", {
      page_location: getSanitizedUrl(),
      page_title: document.title
    });

    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.append(gaScript);
  }

  function withdrawGa() {
    window[`ga-disable-${GA_ID}`] = true;
    gtag("consent", "update", {
      analytics_storage: "denied"
    });
    setConsent("denied");
    clearGaCookies();
    // If GA was loaded during this page session, reload so no in-memory telemetry continues
    if (gaScriptLoaded) {
      location.reload();
    }
  }

  // Check stored consent on initial load
  const currentConsent = getConsent();
  if (currentConsent === "granted") {
    activateGa();
  } else {
    // Ensure GA opt-out flag is set if denied or undecided
    window[`ga-disable-${GA_ID}`] = true;
  }

  // 5. Consent Banner & Preference UI
  function injectStyles() {
    if (document.getElementById("owa-consent-styles")) return;
    const style = document.createElement("style");
    style.id = "owa-consent-styles";
    style.textContent = `
      #owa-consent-banner {
        position: fixed;
        bottom: 20px;
        right: 24px;
        max-width: 520px;
        width: calc(100% - 40px);
        background: rgba(25, 24, 36, 0.96);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--border, #303641);
        border-radius: var(--radius, 15px);
        padding: 20px 22px;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
        color: var(--ink, #F0EEE9);
        font-family: var(--font-body, Inter, system-ui, sans-serif);
        font-size: 0.92rem;
        line-height: 1.55;
        z-index: 9999;
        display: none;
        animation: owaFadeIn 0.25s ease-out;
      }
      @keyframes owaFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        #owa-consent-banner { animation: none !important; }
      }
      @media (max-width: 600px) {
        #owa-consent-banner {
          bottom: 12px;
          right: 12px;
          left: 12px;
          width: calc(100% - 24px);
          padding: 16px;
        }
      }
      .owa-consent-title {
        font-family: var(--font-display, "Space Grotesk", sans-serif);
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin: 0 0 8px 0;
        color: var(--ink, #F0EEE9);
      }
      .owa-consent-text {
        margin: 0 0 16px 0;
        color: var(--muted, #A5ABB5);
        font-size: 0.88rem;
      }
      .owa-consent-text a {
        color: var(--accent, #ffa1b7);
        text-decoration: underline;
        text-underline-offset: 3px;
      }
      .owa-consent-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      .owa-consent-btn {
        flex: 1 1 140px;
        min-height: 40px;
        padding: 9px 18px;
        border-radius: var(--radius-sm, 9px);
        font-family: var(--font-body, Inter, system-ui, sans-serif);
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        text-align: center;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .owa-consent-btn:focus-visible {
        outline: 2px solid var(--accent, #ffa1b7);
        outline-offset: 2px;
      }
      .owa-btn-accept {
        background: var(--ink, #F0EEE9);
        color: #101018;
        border-color: var(--ink, #F0EEE9);
      }
      .owa-btn-accept:hover {
        background: #ffffff;
        border-color: #ffffff;
      }
      .owa-btn-decline {
        background: transparent;
        color: var(--ink, #F0EEE9);
        border-color: var(--border, #303641);
      }
      .owa-btn-decline:hover {
        background: var(--card-2, #29273a);
        border-color: var(--muted, #A5ABB5);
      }
      .fnav-cookie-choice {
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        color: var(--muted, #A5ABB5);
        cursor: pointer;
        text-decoration: none;
      }
      .fnav-cookie-choice:hover {
        color: var(--ink, #F0EEE9);
        text-decoration: underline;
      }
    `;
    document.head.append(style);
  }

  function showBanner() {
    injectStyles();
    let banner = document.getElementById("owa-consent-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "owa-consent-banner";
      banner.setAttribute("role", "region");
      banner.setAttribute("aria-label", "Privacy and cookies");
      banner.setAttribute("aria-live", "polite");
      banner.innerHTML = `
        <h3 class="owa-consent-title">Your privacy matters</h3>
        <p class="owa-consent-text">
          OpenWorld Atlas uses optional analytics cookies to understand how visitors use our website and improve your experience. You can accept or decline analytics tracking and change your preferences at any time. <a href="/privacy">Privacy Policy</a>
        </p>
        <div class="owa-consent-actions">
          <button type="button" id="owa-consent-accept" class="owa-consent-btn owa-btn-accept">Accept Analytics</button>
          <button type="button" id="owa-consent-decline" class="owa-consent-btn owa-btn-decline">Decline</button>
        </div>
      `;
      document.body.append(banner);

      const acceptBtn = banner.querySelector ? banner.querySelector(".owa-btn-accept") : document.getElementById("owa-consent-accept");
      const declineBtn = banner.querySelector ? banner.querySelector(".owa-btn-decline") : document.getElementById("owa-consent-decline");

      if (acceptBtn) {
        acceptBtn.addEventListener("click", () => {
          setConsent("granted");
          banner.style.display = "none";
          activateGa();
        });
      }

      if (declineBtn) {
        declineBtn.addEventListener("click", () => {
          banner.style.display = "none";
          withdrawGa();
        });
      }
    }
    banner.style.display = "block";
    const focusTarget = banner.querySelector ? banner.querySelector(".owa-btn-accept") : document.getElementById("owa-consent-accept");
    if (focusTarget && focusTarget.focus) focusTarget.focus();
  }

  function hideBanner() {
    const banner = document.getElementById("owa-consent-banner");
    if (banner) banner.style.display = "none";
  }

  function initConsentUI() {
    injectStyles();

    // Show banner on first visit if consent is undecided
    if (getConsent() === null) {
      showBanner();
    }

    // Attach footer link across public pages
    const fnav = document.querySelector("footer .fnav");
    if (fnav && !document.getElementById("owa-cookie-choices")) {
      const choiceBtn = document.createElement("button");
      choiceBtn.type = "button";
      choiceBtn.id = "owa-cookie-choices";
      choiceBtn.className = "fnav-cookie-choice";
      choiceBtn.textContent = "Cookie & Analytics Choices";
      choiceBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showBanner();
      });
      fnav.append(choiceBtn);
    }

    // Attach privacy page in-body button if present
    const privacyBtn = document.getElementById("privacy-consent-manage");
    if (privacyBtn) {
      privacyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showBanner();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConsentUI);
  } else {
    initConsentUI();
  }
})();
