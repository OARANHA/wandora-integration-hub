import test from "node:test";
import assert from "node:assert/strict";
import { readProviderProfile } from "../src/providers/provider-profile.mjs";

test("reads provider capability profile", async () => {
  const profile = await readProviderProfile(new URL("../providers/", import.meta.url).pathname, "sample");
  assert.equal(profile.provider, "sample");
  assert.equal(profile.version, 1);
  assert.equal(profile.capabilities[0].capability, "products.search");
  assert.equal(profile.capabilities[0].operationId, "Products_Search");
});
