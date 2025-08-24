import * as fs from "node:fs/promises";
import * as path from "node:path";
import pino from "pino";
type BetterSqlite3Database = any;
type BetterSqlite3Constructor = any;

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

import type { SourceRecord } from "../../types/src/index.js";

let dbOk = false; 
let db: BetterSqlite3Database | null = null;
let Database: BetterSqlite3Constructor | null = null;

async function getDbPath() { const p = path.join(process.cwd(), "workspace","db"); await fs.mkdir(p,{recursive:true}); return path.join(p,"research.db"); }

export async function ensureDb(): Promise<boolean> {
  try {
    if (!Database) { 
      try {
        const mod = await import("better-sqlite3");
        Database = mod.default;
      } catch {
        return false;
      } 
    }
    const dbPath = await getDbPath(); 
    if (!Database) return false;
    db = new Database(dbPath); 
    if (db) {
      db.pragma("journal_mode = WAL");
      db.exec(`CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY, url TEXT, host TEXT, title TEXT, author TEXT, lang TEXT,
      published_at TEXT, extracted_at TEXT, snapshot_path TEXT,
      quality_score REAL, quality_labels TEXT, content_hash TEXT
    );`);
      db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS sources_fts USING fts5(title, url, content, tokenize="porter");`);
    }
    dbOk = true; logger.info({ dbPath }, "sqlite ready"); return true;
  } catch (e) { logger.warn({ err:String(e) }, "sqlite init failed"); dbOk=false; return false; }
}
function hash(s:string){ let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h+s.charCodeAt(i); h|=0; } return String(h>>>0); }
export async function insertSource(rec: SourceRecord): Promise<string|null> {
  if (!dbOk || !db) return null;
  const id = rec.id || (rec.url||"")+"#"+(rec.title||"").slice(0,32);
  const h = hash((rec.url||"")+(rec.title||"")+(rec.content_text||"").slice(0,500));
  const ins = db.prepare(`INSERT OR IGNORE INTO sources (id,url,host,title,author,lang,published_at,extracted_at,snapshot_path,quality_score,quality_labels,content_hash) VALUES (@id,@url,@host,@title,@author,@lang,@published_at,@extracted_at,@snapshot_path,@quality_score,@quality_labels,@content_hash)`);
  ins.run({ id, url: rec.url||"", host: rec.host||"", title: rec.title||"", author: rec.author||"", lang: rec.lang||"",
    published_at: rec.published_at||null, extracted_at: rec.extracted_at||null, snapshot_path: rec.snapshot_path||null,
    quality_score: rec.quality?.score||0, quality_labels: JSON.stringify(rec.quality?.labels||[]), content_hash: h });
  const fts = db.prepare(`INSERT INTO sources_fts(rowid,title,url,content) VALUES ((SELECT rowid FROM sources WHERE id=@id), @title, @url, @content)`);
  fts.run({ id, title: rec.title||"", url: rec.url||"", content: (rec.content_text||"").slice(0,20000) });
  return id;
}
