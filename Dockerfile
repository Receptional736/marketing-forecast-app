# Two-stage build keeps the runtime image small.
# Stage 1 installs all deps and builds the Observable Framework static site.
# Stage 2 copies only what server.js actually needs to run.

FROM node:20-slim AS build
WORKDIR /app

# Install dependencies first so Docker can cache this layer when only source
# files change. package-lock.json is required for `npm ci` (reproducible installs).
COPY package.json package-lock.json ./
RUN npm ci

# Bring in the rest of the source and build the static site into ./dist.
# The forecast app is fully client-side — no BigQuery or other live data
# loaders run during build, so Cloud Build only needs network for npm.
COPY observablehq.config.js ./
COPY src ./src
RUN npm run build

# ── Runtime image ──────────────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Reinstall production-only dependencies (drops rimraf and other devDeps).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Server + built static site. No loader scripts needed at runtime.
COPY server.js ./
COPY --from=build /app/dist ./dist

# Cloud Run injects PORT; default to 8080 so `docker run` also works locally.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
