FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund

COPY src ./src
COPY contracts ./contracts
COPY providers ./providers
COPY vendaerp ./vendaerp
COPY docs ./docs

ENV NODE_ENV=production
ENV REGISTRY_DIR=/app/.data/contracts
ENV PROFILES_DIR=/app/providers

EXPOSE 8080 8081

CMD ["node", "src/api/server.mjs"]
