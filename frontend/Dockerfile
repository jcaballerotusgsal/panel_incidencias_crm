# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/node_modules /app/.next && chown -R node:node /app

FROM base AS development
ENV NODE_ENV=development
COPY docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/dev-entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["sh", "/usr/local/bin/dev-entrypoint.sh"]
CMD ["npm", "run", "dev"]

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-fund

FROM dependencies AS build
COPY . .
RUN npm run build

# Standalone incluye lo necesario para arrancar sin npm install en producción.
FROM base AS production
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
