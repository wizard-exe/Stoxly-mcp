# stdio bridge to the hosted Stoxly MCP endpoint (Streamable HTTP, no auth)
FROM node:22-alpine
RUN npm install -g mcp-remote
ENTRYPOINT ["mcp-remote", "https://stoxlyonline.com/api/mcp"]
