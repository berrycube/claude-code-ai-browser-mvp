import * as http from "node:http"; import * as fs from "node:fs"; import * as path from "node:path"; import * as url from "node:url";
const PORT = Number(process.env.PORT || 7788); const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "packages","live-dashboard","public"); const clients: http.ServerResponse[] = [];
function send(e:any){ const data = `data: ${JSON.stringify(e)}\n\n`; clients.forEach(res=>res.write(data)); }
fs.watch(path.join(ROOT,"workspace"),{recursive:true},(_,f)=>{ if(!f) return; if(!/\.jsonl$|\.json$|\.md$|\.html$/.test(f)) return; send({ type:"fs-update", file:f, time:new Date().toISOString() }); });
const server = http.createServer((req,res)=>{ const p = url.parse(req.url||"/"); if(p.pathname==="/events"){ res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive","Access-Control-Allow-Origin":"*"}); res.write("\n"); clients.push(res); req.on("close",()=>{ const i=clients.indexOf(res); if(i>=0) clients.splice(i,1);}); return; }
  if(p.pathname==="/"||p.pathname==="/index.html"){ const file = path.join(PUBLIC,"index.html"); res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}); return fs.createReadStream(file).pipe(res); }
  res.statusCode=404; res.end("Not found"); });
server.listen(PORT,()=>console.log("Live dashboard on http://localhost:"+PORT));
