# Single-stage build — the marketing forecast app is a self-contained
# HTML file in public/, so there's no build step. The image just needs
# Node + express + ipaddr.js + the source.

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public ./public

# Cloud Run injects PORT; default to 8080 so `docker run` also works locally.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
