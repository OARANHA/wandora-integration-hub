const HTTP_METHODS = new Set(["get","post","put","patch","delete","head","options","trace"]);

function schemaNameFromRef(ref) {
  if (typeof ref !== "string") return null;
  const parts = ref.split("/");
  return parts.at(-1) || null;
}

function schemaShape(schema) {
  if (!schema || typeof schema !== "object") return null;
  if (schema.$ref) return { kind: "ref", ref: schema.$ref, schema: schemaNameFromRef(schema.$ref) };
  if (schema.type === "array") return { kind: "array", items: schemaShape(schema.items) };
  if (schema.type) return { kind: schema.type };
  if (schema.oneOf) return { kind: "oneOf", variants: schema.oneOf.map(schemaShape) };
  if (schema.anyOf) return { kind: "anyOf", variants: schema.anyOf.map(schemaShape) };
  if (schema.allOf) return { kind: "allOf", variants: schema.allOf.map(schemaShape) };
  return { kind: "object" };
}

function responseSchemaFor(response) {
  if (!response || typeof response !== "object") return null;
  const content = response.content;
  if (content && typeof content === "object") {
    const preferred = content["application/json"] || content["application/problem+json"] || Object.values(content)[0];
    if (preferred?.schema) return schemaShape(preferred.schema);
  }
  if (response.schema) return schemaShape(response.schema);
  return null;
}

function securityNames(document, operation) {
  const security = operation.security ?? document.security ?? [];
  if (!Array.isArray(security)) return [];
  return [...new Set(security.flatMap((entry) => entry && typeof entry === "object" ? Object.keys(entry) : []))];
}

function parameterSummary(pathItem, operation) {
  const params = [
    ...(Array.isArray(pathItem?.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation?.parameters) ? operation.parameters : [])
  ];
  return params.map((parameter) => ({
    name: parameter?.name ?? null,
    in: parameter?.in ?? null,
    required: Boolean(parameter?.required),
    schema: schemaShape(parameter?.schema),
    type: parameter?.type ?? null
  }));
}

function requestBodySummary(operation) {
  if (!operation?.requestBody || typeof operation.requestBody !== "object") return null;
  const content = operation.requestBody.content;
  if (!content || typeof content !== "object") return { required: Boolean(operation.requestBody.required), schema: null };
  const preferred = content["application/json"] || Object.values(content)[0];
  return { required: Boolean(operation.requestBody.required), schema: preferred?.schema ? schemaShape(preferred.schema) : null };
}

export function classifyOperationRisk(method) {
  const normalized = String(method).toUpperCase();
  if (["GET","HEAD","OPTIONS"].includes(normalized)) return "read";
  if (normalized === "DELETE") return "destructive";
  if (["POST","PUT","PATCH"].includes(normalized)) return "write";
  return "unknown";
}

export function inspectOpenApi(document, { provider = "unknown" } = {}) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new TypeError("OpenAPI document must be a JSON object.");
  }
  const specification = document.openapi
    ? { family: "openapi", version: String(document.openapi) }
    : document.swagger
      ? { family: "swagger", version: String(document.swagger) }
      : null;
  if (!specification) throw new Error("Document does not declare 'openapi' or 'swagger'.");

  const operations = [];
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") continue;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase()) || !operation || typeof operation !== "object") continue;
      operations.push({
        operationId: operation.operationId ?? null,
        method: method.toUpperCase(),
        path,
        summary: operation.summary ?? null,
        description: operation.description ?? null,
        tags: Array.isArray(operation.tags) ? operation.tags : [],
        risk: classifyOperationRisk(method),
        parameters: parameterSummary(pathItem, operation),
        requestBody: requestBodySummary(operation),
        security: securityNames(document, operation),
        responses: Object.entries(operation.responses ?? {}).map(([status, response]) => ({
          status,
          schema: responseSchemaFor(response)
        }))
      });
    }
  }

  const schemas = document.components?.schemas && typeof document.components.schemas === "object"
    ? document.components.schemas
    : document.definitions && typeof document.definitions === "object"
      ? document.definitions
      : {};

  const securitySchemes = document.components?.securitySchemes && typeof document.components.securitySchemes === "object"
    ? Object.keys(document.components.securitySchemes)
    : document.securityDefinitions && typeof document.securityDefinitions === "object"
      ? Object.keys(document.securityDefinitions)
      : [];

  return {
    provider,
    specification,
    info: {
      title: document.info?.title ?? null,
      version: document.info?.version ?? null,
      description: document.info?.description ?? null
    },
    counts: {
      paths: Object.keys(document.paths ?? {}).length,
      operations: operations.length,
      schemas: Object.keys(schemas).length
    },
    securitySchemes,
    operations,
    schemas: Object.keys(schemas).sort()
  };
}

function searchableText(operation) {
  return [
    operation.operationId,
    operation.method,
    operation.path,
    operation.summary,
    operation.description,
    ...(operation.tags ?? []),
    ...(operation.parameters ?? []).map((p) => p.name)
  ].filter(Boolean).join(" ").toLowerCase();
}

export function searchOperations(contract, query, { limit = 20, risk = null } = {}) {
  const terms = String(query ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return (contract.operations ?? [])
    .filter((operation) => !risk || operation.risk === risk)
    .map((operation) => {
      const text = searchableText(operation);
      const matches = terms.filter((term) => text.includes(term)).length;
      return { operation, score: matches / terms.length };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.operation.path).localeCompare(String(b.operation.path)))
    .slice(0, limit);
}
