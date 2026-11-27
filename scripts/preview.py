"""Serve the public Atlas pages on loopback with Vercel-style clean URLs."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import mimetypes
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = {"/" + p.relative_to(ROOT).with_suffix("").as_posix(): p
         for directory in (ROOT, ROOT / "blog") for p in directory.glob("*.html")}
PAGES["/"] = PAGES.pop("/index")
PAGES["/blog"] = PAGES.pop("/blog/index")
def asset_path(route):
    parts = route.lstrip("/").split("/")
    if any(part in ("", ".", "..") or chr(92) in part or ":" in part for part in parts):
        return None
    allowed = {"images": {".svg", ".webp", ".png", ".json"}, "data": {".json"}, "js": {".js"}}
    path = ROOT.joinpath(*parts)
    if not path.resolve().is_relative_to(ROOT):
        return None
    if route not in {"/app.js", "/styles.css", "/atlas.css", "/robots.txt", "/sitemap.xml", "/llms.txt"}:
        if path.suffix not in allowed.get(parts[0], set()):
            return None
    return path if path.is_file() else None


class Preview(BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.serve(False)

    def do_GET(self):
        self.serve(True)

    def serve(self, body):
        request = urlsplit(self.path)
        route = request.path
        canonical = route.removesuffix(".html").rstrip("/") or "/"
        canonical = {"/index": "/", "/blog/index": "/blog"}.get(canonical, canonical)
        if canonical in PAGES and canonical != route:
            self.send_response(308)
            self.send_header("Location", canonical + ("?" + request.query if request.query else ""))
            self.end_headers()
            return
        path = PAGES.get(route) or asset_path(route)
        status = 200 if path and route != "/404" else 404
        path = path or PAGES["/404"]
        data = path.read_bytes()
        self.send_response(status)
        self.send_header("Content-Type", mimetypes.guess_type(path.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if body:
            self.wfile.write(data)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    ThreadingHTTPServer(("127.0.0.1", port), Preview).serve_forever()
