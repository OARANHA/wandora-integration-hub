# Architecture

## Princípio

MCP é uma interface do Integration Hub, não o domínio do produto.

## Fluxo

ERP/OpenAPI
  -> Contract Registry
  -> Operation & Schema Inspector
  -> Provider Adapter
  -> Wandora Capabilities

Consumidores:
- API interna
- MCP
- agentes Wandora
- painel admin futuro

## Separação de responsabilidades

### Contract Registry
Somente documentação/versionamento. Não guarda segredos e não executa chamadas no provider.

### Provider Adapter
Traduz operações específicas do provider para capabilities estáveis da Wandora.

### Runtime Connector
Executa chamadas reais com credenciais mantidas fora do contrato e sujeitas a políticas.

## Capability examples

- products.search
- products.get
- stock.read
- prices.read
- customers.search
- orders.search
