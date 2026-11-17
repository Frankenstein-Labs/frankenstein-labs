FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git rsync ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY services/worker/package.json ./services/worker/package.json
COPY services/worker/worker.mjs ./services/worker/worker.mjs
COPY scripts ./scripts
COPY catalog ./catalog
ENV NODE_ENV=production
CMD ["node", "services/worker/worker.mjs"]
