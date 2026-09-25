import test from "node:test";
import assert from "node:assert/strict";
import { buildCapabilityMap, resolveCapability, listResolvedCapabilities } from "../src/adapters/capability-mapper.mjs";

const contract = {
  operations: [
    { operationId: "Products_Search", method: "GET", path: "/products", risk: "read" },
    { operationId: "Stock_Get", method: "GET", path: "/stock", risk: "read" }
  ]
};

test("builds a known capability map", () => {
  const map = buildCapabilityMap({
    "products.search": { operationId: "Products_Search" }
  });
  assert.equal(map[0].capability, "products.search");
  assert.equal(map[0].operationId, "Products_Search");
});

test("rejects unknown capabilities", () => {
  assert.throws(
    () => buildCapabilityMap({ "foo.bar": { operationId: "X" } }),
    /Unknown capability/
  );
});

test("resolves capability by operationId", () => {
  const map = buildCapabilityMap({
    "products.search": { operationId: "Products_Search" }
  });
  const resolved = resolveCapability(contract, map, "products.search");
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.operation.path, "/products");
});

test("resolves capability by method and path", () => {
  const map = buildCapabilityMap({
    "stock.read": { method: "GET", path: "/stock" }
  });
  const resolved = resolveCapability(contract, map, "stock.read");
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.operation.operationId, "Stock_Get");
});

test("reports unresolved mapping without guessing", () => {
  const map = buildCapabilityMap({
    "orders.search": { operationId: "Orders_Search" }
  });
  const resolved = listResolvedCapabilities(contract, map)[0];
  assert.equal(resolved.status, "unresolved");
  assert.equal(resolved.operation, null);
});
