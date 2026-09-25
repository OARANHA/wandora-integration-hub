import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256Json, sha256Text } from "../core/hash.mjs";
import { inspectOpenApi } from "./openapi-inspector.mjs";

function safeSegment(value, label) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalized)) throw new Error(`${label} must match [a-z0-9][a-z0-9._-]*`);
  return normalized;
}

export function buildContractRecord({ provider, document, sourceText = null, source = null }) {
  const providerId = safeSegment(provider, "provider");
  const inspection = inspectOpenApi(document, { provider: providerId });
  const canonicalHash = sha256Json(document);
  const sourceHash = sourceText == null ? null : sha256Text(sourceText);
  return {
    registryVersion: 1,
    provider: providerId,
    contractId: `${providerId}:${canonicalHash}`,
    hashes: { canonicalSha256: canonicalHash, sourceSha256: sourceHash },
    source: source ? { type: source.type ?? null, name: source.name ?? null } : null,
    importedAt: new Date().toISOString(),
    ...inspection
  };
}

export async function importContractFile({ provider, filePath, registryDir }) {
  const sourceText = await readFile(filePath, "utf8");
  let document;
  try {
    document = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`Only JSON contracts are supported in phase 1: ${error.message}`);
  }
  const record = buildContractRecord({
    provider,
    document,
    sourceText,
    source: { type: "file", name: filePath }
  });
  const providerDir = join(registryDir, record.provider);
  await mkdir(providerDir, { recursive: true });
  const versionFile = join(providerDir, `${record.hashes.canonicalSha256}.json`);
  const latestFile = join(providerDir, "latest.json");
  const serialized = JSON.stringify(record, null, 2) + "\n";
  await writeFile(versionFile, serialized, "utf8");
  await writeFile(latestFile, serialized, "utf8");
  return { record, versionFile, latestFile };
}

export async function readLatestContract({ provider, registryDir }) {
  const providerId = safeSegment(provider, "provider");
  const text = await readFile(join(registryDir, providerId, "latest.json"), "utf8");
  return JSON.parse(text);
}
