import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getProviderContract,
  listProviderOperations,
  listProviders,
  searchProviderOperations
} from "../src/registry/registry-service.mjs";

async function fixtureRegistry() {
  const root = await mkdtemp(join(tmpdir(), "wandora-registry-"));
  const providerDir = join(root, "sample");
  await mkdir(providerDir, { recursive: true });
  await writeFile(join(providerDir, "latest.json"), JSON.stringify({
    provider: "sample",
    contractId: "sample:abc",
    specification: { family: "openapi", version: "3.0.1" },
    info: { title: "Sample ERP", version: "v1", description: null },
    counts: { paths: 1, operations: 2, schemas: 1 },
    hashes: { canonicalSha256: "abc", sourceSha256: "def" },
    importedAt: "2026-09-25T00:00:00.000Z",
    operations: [
      { operationId: "Products_Search", method: "GET", path: "/products", summary: "Search products", description: null, tags: ["Products"], risk: "read", parameters: [], requestBody: null, security: [], responses: [] },
      { operationId: "Products_Create", method: "POST", path: "/products", summary: "Create product", description: null, tags: ["Products"], risk: "write", parameters: [], requestBody: null, security: [], responses: [] }
    ]
  }, null, 2));
  return root;
}

test("lists providers", async () => {
  const root = await fixtureRegistry();
  const providers = await listProviders(root);
  assert.equal(providers.length, 1);
  assert.equal(providers[0].provider, "sample");
});

test("gets latest provider contract", async () => {
  const root = await fixtureRegistry();
  const contract = await getProviderContract(root, "sample");
  assert.equal(contract.contractId, "sample:abc");
});

test("filters provider operations by risk", async () => {
  const root = await fixtureRegistry();
  const operations = await listProviderOperations(root, "sample", { risk: "read" });
  assert.equal(operations.length, 1);
  assert.equal(operations[0].operationId, "Products_Search");
});

test("searches provider operations", async () => {
  const root = await fixtureRegistry();
  const results = await searchProviderOperations(root, "sample", "search products");
  assert.equal(results[0].operation.operationId, "Products_Search");
});
