FROM node:22-bookworm-slim
WORKDIR /app
COPY services/api/package.json ./package.json
COPY services/api/server.mjs ./server.mjs
COPY catalog ./catalog
ENV NODE_ENV=production
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
