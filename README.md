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

## Fase 1 implementada

O Contract Registry inicial suporta OpenAPI 3.x e Swagger 2.0 em JSON e extrai:

- versão da especificação;
- metadata do contrato;
- quantidade de paths, operações e schemas;
- security schemes documentados;
- operationId, método, path, tags e parâmetros;
- request body;
- schemas das respostas;
- classificação inicial `read`, `write`, `destructive` ou `unknown`;
- hash SHA-256 canônico do contrato;
- hash SHA-256 do arquivo de origem;
- busca textual por operações.

Os arquivos gerados localmente pelo registry ficam em `.data/contracts` e não são versionados.

## Uso

Importar um contrato:

```bash
npm run contract:import -- --provider vendaerp ./swagger.json
```

Pesquisar operações:

```bash
npm run contract:search -- --provider vendaerp products
```

Filtrar somente operações de leitura:

```bash
npm run contract:search -- --provider vendaerp products --risk read
```

Executar testes:

```bash
npm test
```

## Limites atuais

Nesta primeira fase, a importação aceita somente contratos JSON. Suporte a YAML, adapters provider-neutral, runtime connectors, API HTTP, MCP próprio e painel admin entram nas fases seguintes.
