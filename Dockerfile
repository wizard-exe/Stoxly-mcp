# Stoxly MCP server (stdio) — same three tools as the hosted endpoint at
# https://www.stoxlyonline.com/api/mcp, packaged for clients that run MCP
# servers as a local process.
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
ENTRYPOINT ["node", "server.js"]
