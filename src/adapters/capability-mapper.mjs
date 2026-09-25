import { isKnownCapability } from "../core/capabilities.mjs";

function normalizeMappingEntry(capability, entry) {
  if (!isKnownCapability(capability)) {
    throw new Error(`Unknown capability: ${capability}`);
  }
  if (!entry || typeof entry !== "object") {
    throw new Error(`Invalid mapping for capability: ${capability}`);
  }
  if (!entry.operationId && !(entry.method && entry.path)) {
    throw new Error(`Mapping for ${capability} must define operationId or method+path`);
  }
  return {
    capability,
    operationId: entry.operationId ?? null,
    method: entry.method ? String(entry.method).toUpperCase() : null,
    path: entry.path ?? null,
    notes: entry.notes ?? null
  };
}

export function buildCapabilityMap(raw = {}) {
  return Object.entries(raw).map(([capability, entry]) => normalizeMappingEntry(capability, entry));
}

export function resolveCapability(contract, capabilityMap, capability) {
  const mapping = capabilityMap.find((item) => item.capability === capability);
  if (!mapping) return null;

  const operation = (contract.operations ?? []).find((candidate) => {
    if (mapping.operationId && candidate.operationId === mapping.operationId) return true;
    if (mapping.method && mapping.path) {
      return candidate.method === mapping.method && candidate.path === mapping.path;
    }
    return false;
  });

  if (!operation) {
    return {
      capability,
      status: "unresolved",
      mapping,
      operation: null
    };
  }

  return {
    capability,
    status: "resolved",
    mapping,
    operation
  };
}

export function listResolvedCapabilities(contract, capabilityMap) {
  return capabilityMap.map((mapping) => resolveCapability(contract, capabilityMap, mapping.capability));
}
