import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { searchOperations } from "./openapi-inspector.mjs";

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

export async function listProviders(registryDir) {
  let entries = [];
  try {
    entries = await readdir(registryDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const providers = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const latestPath = join(registryDir, entry.name, "latest.json");
    try {
      const contract = await readJson(latestPath);
      providers.push({
        provider: contract.provider,
        contractId: contract.contractId,
        specification: contract.specification,
        info: contract.info,
        counts: contract.counts,
        hashes: contract.hashes,
        importedAt: contract.importedAt
      });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  return providers.sort((a, b) => a.provider.localeCompare(b.provider));
}

export async function getProviderContract(registryDir, provider) {
  const contract = await readJson(join(registryDir, provider, "latest.json"));
  return contract;
}

export async function listProviderOperations(registryDir, provider, { risk = null } = {}) {
  const contract = await getProviderContract(registryDir, provider);
  return (contract.operations ?? []).filter((operation) => !risk || operation.risk === risk);
}

export async function searchProviderOperations(registryDir, provider, query, { risk = null, limit = 20 } = {}) {
  const contract = await getProviderContract(registryDir, provider);
  return searchOperations(contract, query, { risk, limit });
}
