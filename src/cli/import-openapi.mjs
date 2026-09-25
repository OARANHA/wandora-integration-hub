#!/usr/bin/env node
import { resolve } from "node:path";
import { importContractFile } from "../registry/contract-registry.mjs";

const args = process.argv.slice(2);
const providerIndex = args.indexOf("--provider");
const outIndex = args.indexOf("--out");

if (providerIndex === -1 || !args[providerIndex + 1]) {
  console.error("Usage: node src/cli/import-openapi.mjs --provider <id> <openapi.json> [--out <registry-dir>]");
  process.exit(2);
}

const provider = args[providerIndex + 1];
const filePath = args.find((value, index) =>
  !value.startsWith("--") &&
  index !== providerIndex + 1 &&
  index !== outIndex + 1
);

if (!filePath) {
  console.error("Missing OpenAPI/Swagger JSON file path.");
  process.exit(2);
}

const registryDir = resolve(outIndex === -1 ? ".data/contracts" : args[outIndex + 1]);

try {
  const result = await importContractFile({
    provider,
    filePath: resolve(filePath),
    registryDir
  });
  console.log(JSON.stringify({
    provider: result.record.provider,
    contractId: result.record.contractId,
    specification: result.record.specification,
    counts: result.record.counts,
    canonicalSha256: result.record.hashes.canonicalSha256,
    versionFile: result.versionFile,
    latestFile: result.latestFile
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
