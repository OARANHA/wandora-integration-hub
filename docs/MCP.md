# Integration Hub MCP

## Objetivo

O MCP é uma interface do mesmo Contract Registry usado pela API HTTP. Ele não mantém uma base paralela e não contém credenciais de ERP.

## SDK validado

Implementação validada com:

- `@modelcontextprotocol/sdk@1.29.0`
- `zod@3.25.76`
- `McpServer`
- `StreamableHTTPServerTransport`

O endpoint padrão é:

`POST /mcp`

na porta interna `8081`.

## Ferramentas iniciais

- `capabilities_list`
- `providers_list`
- `provider_contract_get`
- `provider_operations_list`
- `provider_contract_search`
- `provider_capabilities_list`
- `provider_capability_resolve`

Todas são somente leitura sobre contratos e profiles locais. Nenhuma delas chama o ERP real.

## Compatibilidade MCP

A versão estável do SDK validada neste projeto suporta a linha de protocolo baseada em inicialização, incluindo:

- 2025-11-25
- 2025-06-18
- 2025-03-26
- 2024-11-05
- 2024-10-07

O handshake foi validado localmente com `2025-11-25`.

A especificação MCP mais nova consultada em setembro de 2026 define a revisão `2026-07-28`, com metadata/capabilities por requisição em vez do handshake clássico. Não misturamos os dois modelos nesta implementação. A migração será tratada quando o SDK estável adotado pelo projeto suportar essa revisão de forma apropriada.

## Deploy

No compose, API e MCP usam a mesma imagem mas executam processos separados:

- `wandora-integration-hub:8080`
- `wandora-integration-mcp:8081`

Ambos compartilham o volume `integration-hub-data`.
