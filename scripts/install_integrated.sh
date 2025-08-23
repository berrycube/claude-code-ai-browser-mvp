#!/usr/bin/env bash
set -e
corepack enable || true
corepack prepare pnpm@9.7.0 --activate || true
pnpm install
pnpm -r build
echo "==> Optional MCP:"
echo "  Brave Search:  claude mcp add brave-search npx -y @modelcontextprotocol/server-brave-search --env BRAVE_API_KEY=$BRAVE_API_KEY"
echo "  SerpApi:       claude mcp add serpapi --env SERPAPI_API_KEY=$SERPAPI_API_KEY -- npx -y @ilyazub/serpapi-mcp-server"
echo "  Qdrant local:  claude mcp add qdrant -e QDRANT_LOCAL_PATH="$PWD/workspace/qdrant" -e COLLECTION_NAME=research-memory -- uvx mcp-server-qdrant"
echo "  Qdrant remote: claude mcp add qdrant -e QDRANT_URL=https://<host>:6333 -e QDRANT_API_KEY=<key> -e COLLECTION_NAME=research-memory -- uvx mcp-server-qdrant"
