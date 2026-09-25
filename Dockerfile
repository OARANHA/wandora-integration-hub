FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY contracts ./contracts
COPY vendaerp ./vendaerp
COPY docs ./docs

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/api/server.mjs"]
