/* Generates the browser configuration from Vercel's public deployment values.
   It intentionally accepts only the Supabase URL and publishable key. */
const fs = require("fs");
const path = require("path");

const url = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const key = (process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || key.length < 20) {
  throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set for this deployment.");
}

const value = `// Generated during deployment. Public Supabase browser configuration only.\n` +
  `window.SUPABASE_URL = ${JSON.stringify(url)};\n` +
  `window.SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(key)};\n`;

fs.writeFileSync(path.join(__dirname, "..", "js", "env.js"), value, "utf8");
console.log("Generated js/env.js from deployment variables.");

if (process.env.VERCEL_ENV === "production") {
  const root = path.join(__dirname, "..");
  const loader = '<script defer src="/js/web-analytics.js"></script>';
  for (const directory of [root, path.join(root, "blog")]) {
    for (const name of fs.readdirSync(directory)) {
      if (!name.endsWith(".html") || name === "admin.html") continue;
      const file = path.join(directory, name);
      const html = fs.readFileSync(file, "utf8");
      if (!html.includes(loader)) {
        fs.writeFileSync(file, html.replace("</head>", loader + "\n</head>"));
      }
    }
  }
}

if (process.env.VERCEL_ENV === "production") {
  const root = path.join(__dirname, "..");
  const loader = '<script defer src="/js/web-analytics.js"></script>';
  for (const directory of [root, path.join(root, "blog")]) {
    for (const name of fs.readdirSync(directory)) {
      if (!name.endsWith(".html") || name === "admin.html") continue;
      const file = path.join(directory, name);
      const html = fs.readFileSync(file, "utf8");
      if (!html.includes(loader)) {
        fs.writeFileSync(file, html.replace("</head>", loader + "\n</head>"));
      }
    }
  }
}
