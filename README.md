# Wandora Integration Hub

Núcleo provider-neutral da Wandora para importar, versionar, inspecionar e normalizar contratos de APIs/ERPs.

## Objetivos iniciais

- registrar providers e contratos OpenAPI/Swagger;
- versionar contratos por hash;
- pesquisar operações, parâmetros, autenticação e schemas;
- mapear capabilities provider-neutral da Wandora;
- comparar contrato documentado com evidência de runtime;
- expor o mesmo núcleo via API, MCP e futuro painel administrativo;
- manter credenciais e execução real separadas do Contract Registry.

## Primeiro provider de validação

VendaERP será o primeiro provider usado para validar a arquitetura. O design não deve depender de nomes, casing ou envelopes específicos do VendaERP.

## Camadas

1. Contract Registry
2. Provider Adapter
3. Runtime Connector
4. API/MCP interfaces
5. Admin UI (futuro consumidor)
