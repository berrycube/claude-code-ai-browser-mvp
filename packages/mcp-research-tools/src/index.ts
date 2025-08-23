import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import Handlebars from "handlebars";
import pino from "pino";
import { z } from "zod";
import { ensureDb, insertSource } from "./db.js";
import { createResearchMachine } from "./state/research.machine.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const server = new McpServer({ name: "research-tools", version: "0.2.1" });
function now() { return new Date().toISOString(); }
function joinCwd(...p: string[]) { return path.join(process.cwd(), ...p); }

// extract_readable
const ExtractInput = z.object({ html: z.string(), url: z.string().optional() });
server.registerTool("extract_readable", { title: "Extract", description: "Extract readable content from HTML", inputSchema: ExtractInput as any }, async (args) => {
  const { html, url } = ExtractInput.parse(args);
  const dom = new JSDOM(html, { url: url || "https://example.com" });
  const reader = new Readability(dom.window.document);
  const art = reader.parse();
  return { content: [{ type: "json", json: {
    title: art?.title || dom.window.document.title || "",
    byline: art?.byline || "", excerpt: art?.excerpt || "",
    content_text: (art?.textContent || "").trim(),
    length: (art?.textContent || "").trim().length,
    url: url || null, extracted_at: now()
  } }] };
});

// normalize
const NormalizeInput = z.object({ item: z.record(z.any()) });
server.registerTool("normalize", { title: "Normalize", description: "Normalize fields (lang/time/host/keywords)", inputSchema: NormalizeInput as any }, async (args) => {
  const { item } = NormalizeInput.parse(args);
  const u = item.url ? new URL(item.url) : null;
  const host = u ? u.hostname.replace(/^www\./,"") : "";
  const lang = item.lang || (/[一-龥]/.test(item.content_text||"") ? "zh" : "en");
  return { content: [{ type: "json", json: {
    id: item.id || (item.url || "") + "#" + (item.title||"").slice(0,32),
    url: item.url, host, title: item.title || "", author: item.byline || item.author || "",
    lang, published_at: item.published_at || null, extracted_at: item.extracted_at || now(),
    content_text: item.content_text || item.text || "", keywords: (item.keywords || [])
  } }] };
});

// quality_score
const QualityInput = z.object({ item: z.record(z.any()) });
server.registerTool("quality_score", { title: "Quality", description: "Heuristic quality scoring", inputSchema: QualityInput as any }, async (args) => {
  const { item } = QualityInput.parse(args);
  const url = String(item.url || ""); const text = String(item.content_text || item.text || "").toLowerCase();
  let score = 0.4; const labels: string[] = [];
  if (/\.gov|\.edu|who\.int|oecd\.org|arxiv\.org|wikipedia\.org/.test(url)) { score += 0.2; labels.push("authoritative"); }
  if (/(sponsor|advertorial|promotion|优惠|种草|联盟链接)/.test(text)) { score -= 0.2; labels.push("marketing"); }
  const len = (item.content_text || "").length; score += Math.min(0.2, len/8000*0.2);
  const published = Date.parse(item.published_at || item.extracted_at || 0);
  if (isFinite(published)) { const months = (Date.now() - published)/(30*24*3600*1000);
    if (months > 36) { score -= 0.2; labels.push("stale>36m"); } else if (months > 18) { score -= 0.1; labels.push("stale>18m"); } }
  score = Math.max(0, Math.min(1, score));
  return { content: [{ type: "json", json: { score, labels } }] };
});

// md_report
const ReportInput = z.object({ path: z.string(), context: z.record(z.any()) });
server.registerTool("md_report", { title: "Report", description: "Render report.md.hbs to path", inputSchema: ReportInput as any }, async (args) => {
  const { path: outPath, context } = ReportInput.parse(args);
  const tpl = Handlebars.compile(await fs.readFile(joinCwd("templates","report.md.hbs"),"utf8"), { noEscape:true });
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, tpl(context), "utf8");
  logger.info({ outPath }, "report written");
  return { content: [{ type: "text", text: `Wrote report to ${outPath}` }] };
});

// render_dashboard
const DashInput = z.object({ path: z.string(), context: z.record(z.any()) });
server.registerTool("render_dashboard", { title: "Dashboard", description: "Render dashboard.html.hbs to path", inputSchema: DashInput as any }, async (args) => {
  const { path: outPath, context } = DashInput.parse(args);
  const tpl = Handlebars.compile(await fs.readFile(joinCwd("templates","dashboard.html.hbs"),"utf8"), { noEscape:true });
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, tpl(context), "utf8");
  logger.info({ outPath }, "dashboard written");
  return { content: [{ type: "text", text: `Wrote dashboard to ${outPath}` }] };
});

// db.ensure / db.insert (optional SQLite)
server.registerTool("db.ensure", { title: "Ensure SQLite", description: "Create workspace/db/research.db if missing" }, async () => {
  const ok = await ensureDb(); return { content: [{ type: "text", text: ok ? "db ready" : "db unavailable (fallback)" }] };
});
const InsertInput = z.object({ record: z.record(z.any()) });
server.registerTool("db.insert_source", { title: "Insert source", description: "Insert normalized source into DB", inputSchema: InsertInput as any }, async (args) => {
  const { record } = InsertInput.parse(args); const id = await insertSource(record);
  return { content: [{ type: "json", json: { id } }] };
});

// connect
const transport = new StdioServerTransport();
await server.connect(transport);
