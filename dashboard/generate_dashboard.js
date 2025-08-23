#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";

function parseJSONL(text) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(JSON.parse);
}
function bucket(score) { if (score >= 0.8) return "high"; if (score >= 0.5) return "medium"; return "low"; }

async function main() {
  const root = process.cwd();
  const srcPath = path.join(root, "workspace", "sources", "normalized.jsonl");
  const tplPath = path.join(root, "templates", "dashboard.html.hbs");
  const outPath = path.join(root, "workspace", "reports", "dashboard.html");

  const [jsonl, tplStr] = await Promise.all([
    fs.readFile(srcPath, "utf8"),
    fs.readFile(tplPath, "utf8")
  ]);

  const items = parseJSONL(jsonl);
  const bySource = {}, byQual = { high:0, medium:0, low:0 }, termCount = {};
  const samples = items.slice(0,50).map(it => ({
    title: it.title || "", source: (new URL(it.url).hostname).replace(/^www\./,""),
    time: it.published_at || it.extracted_at || "", quality: (it.quality?.score ?? 0).toFixed(2),
    url: it.url
  }));
  for (const it of items) {
    const host = (new URL(it.url).hostname).replace(/^www\./,"");
    bySource[host] = (bySource[host] || 0) + 1;
    byQual[bucket(it.quality?.score ?? 0)]++;
    for (const t of (it.keywords || [])) termCount[t] = (termCount[t] || 0) + 1;
  }
  const top_terms = Object.entries(termCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([term,count])=>({term, count}));
  const ctx = { topic: "未命名主题", langs: "zh,en", since: "N/A", until: "N/A",
    date: new Date().toISOString().slice(0,19).replace("T"," "),
    stats: { by_source: bySource, by_quality_bucket: byQual,
      recent_14d: items.filter(it => { const d = new Date(it.published_at || it.extracted_at || 0); return Date.now()-d.getTime() <= 14*24*3600*1000; }).length,
      top_terms }, samples };
  const tpl = Handlebars.compile(tplStr, { noEscape: true });
  const html = tpl(ctx);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, html, "utf8");
  console.log("Dashboard written:", outPath);
}
main().catch(e => { console.error(e); process.exit(1); });
