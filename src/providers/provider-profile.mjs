import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildCapabilityMap } from "../adapters/capability-mapper.mjs";

export async function readProviderProfile(baseDir, provider) {
  const path = join(baseDir, provider, "profile.json");
  const text = await readFile(path, "utf8");
  const profile = JSON.parse(text);

  return {
    provider,
    version: profile.version ?? 1,
    capabilities: buildCapabilityMap(profile.capabilities ?? {})
  };
}
