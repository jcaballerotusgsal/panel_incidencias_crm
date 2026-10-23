# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN mkdir -p /app/node_modules /app/dist && chown -R node:node /app

# Desarrollo: el código llega por bind mount y se instalan dependencias al iniciar.
FROM base AS development
ENV NODE_ENV=development
COPY docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/dev-entrypoint.sh
USER node
EXPOSE 3001
ENTRYPOINT ["sh", "/usr/local/bin/dev-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# Las imágenes compiladas exigen un lockfile generado, revisado y versionado.
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-fund

FROM dependencies AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev --no-fund

FROM base AS production
ENV NODE_ENV=production PORT=3001 ENABLE_SWAGGER=false
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=dependencies --chown=node:node /app/package.json /app/package-lock.json ./
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
