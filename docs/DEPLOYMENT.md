# Deployment

## Papel do Portainer

Portainer gerencia o container/stack. Ele não é o painel administrativo da Wandora.

## Serviço

O Integration Hub roda como serviço independente:

- container: `wandora-integration-hub`
- porta interna: `8080`
- health: `GET /health`
- dados persistentes: volume `integration-hub-data`

## Rede

O compose assume uma rede Docker externa chamada `wandora-edge`, compartilhada com o reverse proxy.

## Traefik

Quando o serviço for promovido para produção, o Traefik poderá expor:

`integrations.wandora.com.br -> wandora-integration-hub:8080`

As labels do Traefik não foram incluídas nesta fase para evitar publicar um hostname antes da decisão de deploy.

## Painel admin futuro

O painel administrativo será um serviço separado e consumirá a API do Integration Hub. Exemplo futuro:

`painel.wandora.com.br -> wandora-admin-web`

O Portainer continuará apenas como ferramenta de infraestrutura.

## Validação atual

Os testes Node passam no target `wandora-agent`. O build Docker ainda não pôde ser validado nesse target porque o daemon/proxy retornou HTTP 403 para `docker build`; nenhuma tentativa de contornar a política foi feita.
