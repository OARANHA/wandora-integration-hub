import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectOpenApi, searchOperations } from "../src/registry/openapi-inspector.mjs";
import { buildContractRecord } from "../src/registry/contract-registry.mjs";

const fixtureText = await readFile(new URL("./fixtures/sample-openapi.json", import.meta.url), "utf8");
const fixture = JSON.parse(fixtureText);

test("inspects OpenAPI metadata and counts", () => {
  const result = inspectOpenApi(fixture, { provider: "sample" });
  assert.equal(result.provider, "sample");
  assert.deepEqual(result.specification, { family: "openapi", version: "3.0.1" });
  assert.deepEqual(result.counts, { paths: 1, operations: 2, schemas: 1 });
  assert.deepEqual(result.securitySchemes, ["ApiKey"]);
});

test("preserves response array/ref shape", () => {
  const result = inspectOpenApi(fixture, { provider: "sample" });
  const search = result.operations.find((op) => op.operationId === "Products_Search");
  assert.equal(search.risk, "read");
  assert.deepEqual(search.responses[0].schema, {
    kind: "array",
    items: {
      kind: "ref",
      ref: "#/components/schemas/Product",
      schema: "Product"
    }
  });
});

test("classifies write operations", () => {
  const result = inspectOpenApi(fixture, { provider: "sample" });
  const create = result.operations.find((op) => op.operationId === "Products_Create");
  assert.equal(create.risk, "write");
  assert.deepEqual(create.requestBody.schema, {
    kind: "ref",
    ref: "#/components/schemas/Product",
    schema: "Product"
  });
});

test("searches operations by semantic surface text", () => {
  const contract = inspectOpenApi(fixture, { provider: "sample" });
  const hits = searchOperations(contract, "search products");
  assert.equal(hits[0].operation.operationId, "Products_Search");
  assert.equal(hits[0].score, 1);
});

test("builds stable canonical contract hash", () => {
  const a = buildContractRecord({ provider: "sample", document: fixture, sourceText: fixtureText });
  const reordered = JSON.parse(JSON.stringify(fixture));
  const b = buildContractRecord({ provider: "sample", document: reordered, sourceText: JSON.stringify(reordered) });
  assert.equal(a.hashes.canonicalSha256, b.hashes.canonicalSha256);
});
