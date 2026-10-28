// Test-only HTTPS entrypoint. All upstreams must be loopback; no credentials logged.
import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import next from "next";

const cfg = JSON.parse(fs.readFileSync(0, "utf8"));
for (const port of [cfg.port, cfg.authPort, cfg.restPort]) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error("Invalid local test port");
}
const app = next({ dev: false, dir: cfg.appDir, hostname: "127.0.0.1", port: cfg.port });
await app.prepare();
const handle = app.getRequestHandler();
const server = https.createServer({
  cert: fs.readFileSync(cfg.cert), key: fs.readFileSync(cfg.key),
}, (req, res) => {
  const parsed = new URL(req.url, "https://127.0.0.1");
  const prefix = parsed.pathname.startsWith("/auth/v1/") ? "/auth/v1" :
    parsed.pathname.startsWith("/rest/v1/") ? "/rest/v1" : null;
  if (!prefix) {
    req.headers["x-forwarded-proto"] = "https";
    req.headers["x-forwarded-host"] = req.headers.host;
    Promise.resolve(handle(req, res)).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end("Local test application request failed");
    });
    return;
  }
  const port = prefix === "/auth/v1" ? cfg.authPort : cfg.restPort;
  const headers = { ...req.headers, host: `127.0.0.1:${port}`, connection: "close" };
  delete headers["transfer-encoding"];
  const upstream = http.request({
    hostname: "127.0.0.1", port, method: req.method,
    path: parsed.pathname.slice(prefix.length) + parsed.search, headers,
  }, response => {
    res.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(res);
  });
  upstream.setTimeout(15000, () => upstream.destroy());
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502);
    res.end("Local test upstream unavailable");
  });
  req.pipe(upstream);
});
server.listen(cfg.port, "127.0.0.1", () => console.log("PASS: isolated HTTPS application server ready"));
