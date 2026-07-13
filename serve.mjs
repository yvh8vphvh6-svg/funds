#!/usr/bin/env node
// serve.mjs — zero-dependency local dev server for fund-console.html (Node 18+).
//
// SECURITY MODEL
//   • Binds 127.0.0.1 ONLY — never a LAN interface. Auto-reload is therefore
//     localhost-only by construction.
//   • The file on disk keeps its hardened CSP (connect-src 'none'). Only the
//     copy THIS server sends is modified: connect-src is relaxed to 'self'
//     (same-origin only) and a tiny reload client is injected before </body>.
//     Opened from file://, the app remains incapable of any network request.

import { createServer } from "node:http";
import { readFile, watch } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";                 // localhost only
const PORT = Number(process.env.PORT) || 5501;   // matches the Live Server port
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PAGE = "fund-console.html";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript",
  ".mjs":  "text/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".md":   "text/markdown; charset=utf-8",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon"
};

/* --- live reload: watch the page, ping every connected browser tab ------ */
const clients = new Set();
let debounce = null;
watch(join(ROOT, PAGE), () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    for (const res of clients) res.write("data: reload\n\n");
  }, 120);
});

// Injected at serve time — never present in the file on disk. Double-guarded:
// only this localhost-bound server ships it, and it only runs on localhost.
const RELOAD_SNIPPET = [
  "<script>",
  'if (location.hostname === "localhost" || location.hostname === "127.0.0.1"){',
  '  new EventSource("/__reload").onmessage = () => location.reload();',
  "}",
  "</scr" + "ipt>"
].join("\n");

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://" + HOST);

  if (url.pathname === "/__reload"){
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      "connection": "keep-alive"
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  const rel = url.pathname === "/" ? PAGE : decodeURIComponent(url.pathname.slice(1));
  const path = normalize(join(ROOT, rel));
  if (!path.startsWith(ROOT)){                       // no path traversal
    res.writeHead(403, { "content-type": "text/plain" });
    res.end("forbidden");
    return;
  }

  readFile(path, (err, buf) => {
    if (err){
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found: " + rel);
      return;
    }
    const type = MIME[extname(path)] || "application/octet-stream";
    if (rel === PAGE){
      // Relax connect-src inside the CSP <meta> tag ONLY — anchored on the
      // http-equiv attribute so a comment mentioning the directive (the page
      // has one) can never soak up the replacement instead.
      const html = buf.toString("utf8")
        .replace(/(http-equiv="Content-Security-Policy"[\s\S]*?)connect-src 'none'/,
                 "$1connect-src 'self'")                       // allow same-origin SSE only
        .replace("</body>", RELOAD_SNIPPET + "\n</body>");
      res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      res.end(html);
      return;
    }
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(buf);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`fund-console dev server → http://${HOST}:${PORT}/  (localhost only)`);
  console.log(`auto-reload: watching ${PAGE} — save it and open tabs refresh.`);
});
