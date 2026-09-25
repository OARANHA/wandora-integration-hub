import http from "node:http";
import { URL } from "node:url";
import { resolve } from "node:path";
import {
  getProviderContract,
  listProviderOperations,
  listProviders,
  searchProviderOperations
} from "../registry/registry-service.mjs";

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const registryDir = resolve(process.env.REGISTRY_DIR || ".data/contracts");

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function providerFromPath(pathname, suffix = "") {
  const prefix = "/providers/";
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  if (suffix && !rest.endsWith(suffix)) return null;
  const raw = suffix ? rest.slice(0, -suffix.length) : rest;
  if (!raw || raw.includes("/")) return null;
  return decodeURIComponent(raw);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, {
        service: "wandora-integration-hub",
        status: "ok",
        version: "0.1.0"
      });
    }

    if (req.method === "GET" && url.pathname === "/") {
      return json(res, 200, {
        name: "Wandora Integration Hub",
        phase: 1,
        endpoints: [
          "/health",
          "/providers",
          "/providers/:provider",
          "/providers/:provider/operations",
          "/providers/:provider/search?q=..."
        ]
      });
    }

    if (req.method === "GET" && url.pathname === "/providers") {
      return json(res, 200, { providers: await listProviders(registryDir) });
    }

    const operationsProvider = providerFromPath(url.pathname, "/operations");
    if (req.method === "GET" && operationsProvider) {
      const risk = url.searchParams.get("risk");
      return json(res, 200, {
        provider: operationsProvider,
        operations: await listProviderOperations(registryDir, operationsProvider, { risk })
      });
    }

    const searchProvider = providerFromPath(url.pathname, "/search");
    if (req.method === "GET" && searchProvider) {
      const q = url.searchParams.get("q") || "";
      const risk = url.searchParams.get("risk");
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
      if (!q.trim()) return json(res, 400, { error: "missing_query", field: "q" });
      return json(res, 200, {
        provider: searchProvider,
        query: q,
        results: await searchProviderOperations(registryDir, searchProvider, q, { risk, limit })
      });
    }

    const contractProvider = providerFromPath(url.pathname);
    if (req.method === "GET" && contractProvider) {
      return json(res, 200, await getProviderContract(registryDir, contractProvider));
    }

    return json(res, 404, { error: "not_found" });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return json(res, 404, { error: "provider_not_found" });
    }
    console.error(error);
    return json(res, 500, { error: "internal_error" });
  }
});

server.listen(port, host, () => {
  console.log(`wandora-integration-hub listening on http://${host}:${port}`);
});
