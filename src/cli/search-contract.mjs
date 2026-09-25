#!/usr/bin/env node
import { resolve } from "node:path";
import { readLatestContract } from "../registry/contract-registry.mjs";
import { searchOperations } from "../registry/openapi-inspector.mjs";

const args = process.argv.slice(2);
const providerIndex = args.indexOf("--provider");
const registryIndex = args.indexOf("--registry");
const riskIndex = args.indexOf("--risk");

if (providerIndex === -1 || !args[providerIndex + 1]) {
  console.error("Usage: node src/cli/search-contract.mjs --provider <id> <query> [--registry <dir>] [--risk read|write|destructive]");
  process.exit(2);
}

const provider = args[providerIndex + 1];
const query = args.find((value, index) =>
  !value.startsWith("--") &&
  index !== providerIndex + 1 &&
  index !== registryIndex + 1 &&
  index !== riskIndex + 1
);

if (!query) {
  console.error("Missing search query.");
  process.exit(2);
}

const registryDir = resolve(registryIndex === -1 ? ".data/contracts" : args[registryIndex + 1]);
const risk = riskIndex === -1 ? null : args[riskIndex + 1];

try {
  const contract = await readLatestContract({ provider, registryDir });
  const results = searchOperations(contract, query, { risk });
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
