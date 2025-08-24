import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const PORT = Number(process.env.PORT || 7788);
const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "packages", "live-dashboard", "public");

// Store active SSE connections
const clients: http.ServerResponse[] = [];

/**
 * Send data to all connected clients via Server-Sent Events
 */
function sendToClients(event: { type: string; file?: string; time: string }): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((res) => res.write(data));
}

// Watch workspace directory for changes
fs.watch(
  path.join(ROOT, "workspace"),
  { recursive: true },
  (eventType, filename) => {
    if (!filename) return;
    
    // Only watch specific file types
    if (!/\.jsonl$|\.json$|\.md$|\.html$/.test(filename)) return;
    
    sendToClients({
      type: "fs-update",
      file: filename,
      time: new Date().toISOString()
    });
  }
);

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || "/");
  
  // Handle Server-Sent Events endpoint
  if (parsedUrl.pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });
    
    res.write("\n");
    clients.push(res);
    
    // Clean up client connection when closed
    req.on("close", () => {
      const index = clients.indexOf(res);
      if (index >= 0) {
        clients.splice(index, 1);
      }
    });
    
    return;
  }
  
  // Serve index.html for root and /index.html requests
  if (parsedUrl.pathname === "/" || parsedUrl.pathname === "/index.html") {
    const indexFile = path.join(PUBLIC, "index.html");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return fs.createReadStream(indexFile).pipe(res);
  }
  
  // Handle 404 for all other routes
  res.statusCode = 404;
  res.end("Not found");
});

// Start server
server.listen(PORT, () => {
  logger.info({ port: PORT }, "Live dashboard running");
});

export default server;