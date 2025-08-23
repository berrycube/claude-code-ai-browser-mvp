import * as fs from "node:fs";
import * as path from "node:path";
export function loadPolicy() {
  try { const p = path.join(process.cwd(), "config", "policy.json"); return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { return { actions: { deny_domains: [], ask_patterns: [], pause_keywords: [], snapshot_pdf_domains: [] } }; }
}
