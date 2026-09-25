import http from "node:http";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { listCapabilities } from "../core/capabilities.mjs";
import {
  getProviderContract,
  listProviderOperations,
  listProviders,
  searchProviderOperations
} from "../registry/registry-service.mjs";
import { readProviderProfile } from "../providers/provider-profile.mjs";
import { listResolvedCapabilities, resolveCapability } from "../adapters/capability-mapper.mjs";

const host = process.env.MCP_HOST || "0.0.0.0";
const port = Number(process.env.MCP_PORT || 8081);
const registryDir = resolve(process.env.REGISTRY_DIR || ".data/contracts");
const profilesDir = resolve(process.env.PROFILES_DIR || "providers");

function result(output) {
  return {
    content: [{ type: "text", text: JSON.stringify(output) }],
    structuredContent: output
  };
}

function buildServer() {
  const server = new McpServer({
    name: "wandora-integration-hub",
    version: "0.1.0"
  });

  server.registerTool(
    "capabilities_list",
    {
      description: "List provider-neutral Wandora integration capabilities.",
      inputSchema: {}
    },
    async () => result({ capabilities: listCapabilities() })
  );

  server.registerTool(
    "providers_list",
    {
      description: "List providers with imported latest contracts.",
      inputSchema: {}
    },
    async () => result({ providers: await listProviders(registryDir) })
  );

  server.registerTool(
    "provider_contract_get",
    {
      description: "Get the latest imported contract summary and operations for one provider.",
      inputSchema: {
        provider: z.string().min(1)
      }
    },
    async ({ provider }) => result(await getProviderContract(registryDir, provider))
  );

  server.registerTool(
    "provider_operations_list",
    {
      description: "List documented operations for a provider, optionally filtered by risk.",
      inputSchema: {
        provider: z.string().min(1),
        risk: z.enum(["read", "write", "destructive", "unknown"]).optional()
      }
    },
    async ({ provider, risk }) => result({
      provider,
      operations: await listProviderOperations(registryDir, provider, { risk: risk ?? null })
    })
  );

  server.registerTool(
    "provider_contract_search",
    {
      description: "Search documented provider operations without making any provider API call.",
      inputSchema: {
        provider: z.string().min(1),
        query: z.string().min(1),
        risk: z.enum(["read", "write", "destructive", "unknown"]).optional(),
        limit: z.number().int().min(1).max(100).optional()
      }
    },
    async ({ provider, query, risk, limit }) => result({
      provider,
      query,
      results: await searchProviderOperations(
        registryDir,
        provider,
        query,
        { risk: risk ?? null, limit: limit ?? 20 }
      )
    })
  );

  server.registerTool(
    "provider_capabilities_list",
    {
      description: "Resolve all explicit provider capability mappings against the imported contract.",
      inputSchema: {
        provider: z.string().min(1)
      }
    },
    async ({ provider }) => {
      const contract = await getProviderContract(registryDir, provider);
      const profile = await readProviderProfile(profilesDir, provider);
      return result({
        provider,
        profileVersion: profile.version,
        capabilities: listResolvedCapabilities(contract, profile.capabilities)
      });
    }
  );

  server.registerTool(
    "provider_capability_resolve",
    {
      description: "Resolve one Wandora capability to its explicitly mapped provider operation. Never guesses mappings.",
      inputSchema: {
        provider: z.string().min(1),
        capability: z.string().min(1)
      }
    },
    async ({ provider, capability }) => {
      const contract = await getProviderContract(registryDir, provider);
      const profile = await readProviderProfile(profilesDir, provider);
      const resolution = resolveCapability(contract, profile.capabilities, capability);
      return result(resolution ?? {
        capability,
        status: "not_mapped",
        operation: null
      });
    }
  );

  return server;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const sessions = new Map();

const httpServer = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/mcp")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }

  try {
    const sessionId = req.headers["mcp-session-id"];
    let transport = typeof sessionId === "string" ? sessions.get(sessionId) : undefined;

    if (req.method === "POST") {
      const body = await readJsonBody(req);

      if (!transport && isInitializeRequest(body)) {
        const server = buildServer();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, transport);
          }
        });
        transport.onclose = () => {
          if (transport?.sessionId) sessions.delete(transport.sessionId);
        };
        await server.connect(transport);
      }

      if (!transport) {
        res.writeHead(sessionId ? 404 : 400, { "content-type": "application/json" });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: sessionId ? -32001 : -32000,
            message: sessionId ? "Session not found" : "Initialization required"
          },
          id: body?.id ?? null
        }));
        return;
      }

      await transport.handleRequest(req, res, body);
      return;
    }

    if ((req.method === "GET" || req.method === "DELETE") && transport) {
      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(405, { "content-type": "application/json" });
    res.end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed" },
      id: null
    }));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json" });
    }
    res.end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32603, message: "Internal error" },
      id: null
    }));
  }
});

httpServer.listen(port, host, () => {
  console.log(`wandora-integration-hub MCP listening on http://${host}:${port}/mcp`);
});
