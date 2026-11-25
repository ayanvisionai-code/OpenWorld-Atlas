#!/usr/bin/env python3
"""
OpenWorld Atlas — one-time import of bundled JSON content into Supabase.

Reads data/*.json and upserts every record into the `content` table.
Idempotent: safe to re-run (upserts on type+slug). Existing rows are NOT
deleted — only the records present in the JSON are created/updated.

SETUP (run in your terminal, NOT in browser code):
  Windows (PowerShell):
    $env:SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"
    $env:SUPABASE_SECRET_KEY = "YOUR-SUPABASE-SECRET-KEY"  # server-side ONLY
    python supabase/import_from_json.py

  macOS/Linux:
    SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
    SUPABASE_SECRET_KEY=YOUR-SUPABASE-SECRET-KEY python3 supabase/import_from_json.py

The service-role key must NEVER be committed, shared, or used client-side.
"""
import json
import os
import sys
import argparse
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TYPE_MAP = [  # (json file, list key, content type)
    ("cheats.json",     "cheats",     "cheat"),
    ("characters.json", "characters", "character"),
    ("vehicles.json",   "vehicles",   "vehicle"),
    ("weapons.json",    "weapons",    "weapon"),
    ("locations.json",  "regions",    "location"),
    ("missions.json",   "missions",   "mission"),
    ("guides.json",     "guides",     "guide"),
]

def row_for(rtype, rec, publish=False):
    fields = {k: v for k, v in rec.items() if k != "id"}
    fields["id"] = rec.get("id")
    title = rec.get("name") or rec.get("title") or rec.get("id")
    return {
        "type": rtype,
        "slug": rec.get("id"),
        "title": title,
        "description": rec.get("summary") or rec.get("effect") or rec.get("description") or rec.get("officialText"),
        "verification": rec.get("verification") or "SUPPORTED",
        "verified_at": "2026-11-25",
        # Existing seed data is imported as drafts unless an editor explicitly
        # reviewed it and opted in with --publish.
        "status": "published" if publish else "draft",
        "published_at": None,
        "fields": fields,
    }

def main():
    parser = argparse.ArgumentParser(description="Import bundled Atlas seed records.")
    parser.add_argument("--publish", action="store_true", help="Publish imported rows after editorial review.")
    args = parser.parse_args()
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SECRET_KEY", "")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_SECRET_KEY environment variables first (see file header).")
    if "service" not in key.lower() and not key.startswith("sb_secret") and len(key) < 100:
        print("WARNING: that key does not look like a service-role key; import may fail with RLS errors.")

    rows = []
    for fname, listkey, rtype in TYPE_MAP:
        path = os.path.join(BASE, "data", fname)
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        recs = data.get(listkey, [])
        now = "now"
        for rec in recs:
            row = row_for(rtype, rec, publish=args.publish)
            if row["status"] == "published" and not row["published_at"]:
                row["published_at"] = now
            rows.append(row)

    print(f"Upserting {len(rows)} records into {url}/rest/v1/content …")
    payload = json.dumps(rows, ensure_ascii=False).encode()
    req = urllib.request.Request(
        url + "/rest/v1/content?on_conflict=type,slug",
        data=payload,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=count",
        },
    )
    with urllib.request.urlopen(req) as resp:
        count = resp.headers.get("content-range", "?")
        print("Done. Affected rows:", count)

if __name__ == "__main__":
    main()
