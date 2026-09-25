export const CAPABILITIES = Object.freeze({
  "products.search": {
    domain: "products",
    action: "search",
    risk: "read"
  },
  "products.get": {
    domain: "products",
    action: "get",
    risk: "read"
  },
  "stock.read": {
    domain: "stock",
    action: "read",
    risk: "read"
  },
  "prices.read": {
    domain: "prices",
    action: "read",
    risk: "read"
  },
  "customers.search": {
    domain: "customers",
    action: "search",
    risk: "read"
  },
  "orders.search": {
    domain: "orders",
    action: "search",
    risk: "read"
  }
});

export function isKnownCapability(name) {
  return Object.hasOwn(CAPABILITIES, name);
}

export function listCapabilities() {
  return Object.entries(CAPABILITIES).map(([name, meta]) => ({ name, ...meta }));
}
