FROM node:22-bookworm-slim
WORKDIR /app
COPY services/api/package.json ./package.json
COPY services/api/server.mjs ./server.mjs
COPY catalog ./catalog
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.mjs"]
