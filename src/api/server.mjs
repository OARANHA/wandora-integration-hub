import http from "node:http";
import { URL } from "node:url";

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      service: "wandora-integration-hub",
      status: "ok",
      version: "0.1.0"
    }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      name: "Wandora Integration Hub",
      phase: 1,
      endpoints: ["/health"]
    }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, host, () => {
  console.log(`wandora-integration-hub listening on http://${host}:${port}`);
});
