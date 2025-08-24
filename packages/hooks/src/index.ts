import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import type { Policy } from "../../types/src/index.js";

// Policy loading function
export function loadPolicy(): Policy {
  try { 
    const p = path.join(process.cwd(), "config", "policy.json"); 
    return JSON.parse(fs.readFileSync(p, "utf8")) as Policy; 
  } catch { 
    return { 
      actions: { 
        deny_domains: [], 
        ask_patterns: [], 
        pause_keywords: [], 
        snapshot_pdf_domains: [] 
      } 
    }; 
  }
}

// Pre-tool guard logic
const PreToolInput = z.object({ 
  url: z.string().optional(), 
  action: z.string().optional() 
});

export async function executePreToolGuard(): Promise<void> {
  const raw = await readStdinInput();
  const data = PreToolInput.safeParse(JSON.parse(raw||"{}")); 
  const policy = loadPolicy();
  
  if (!data.success) {
    // Note: console.log is intentional - this outputs to MCP tool stdout
    // Do not replace with logger as it would break the MCP protocol
    return console.log(JSON.stringify({ 
      permissionDecision:"ask", 
      reason:"bad input" 
    }));
  }
  
  const url = data.data.url || ""; 
  const deny = policy.actions?.deny_domains||[]; 
  const ask = policy.actions?.ask_patterns||[];
  
  if (deny.some((d:string)=> url.includes(d))) {
    // Note: console.log is intentional - MCP protocol output
    return console.log(JSON.stringify({ 
      permissionDecision:"deny", 
      reason:"blocked domain" 
    }));
  }
  
  if (ask.some((p:string)=> new RegExp(p,'i').test(url))) {
    // Note: console.log is intentional - MCP protocol output
    return console.log(JSON.stringify({ 
      permissionDecision:"ask", 
      reason:"sensitive pattern" 
    }));
  }
  
  // Note: console.log is intentional - MCP protocol output
  console.log(JSON.stringify({ 
    permissionDecision:"allow", 
    reason:"ok" 
  }));
}

// Post-tool detection logic
const PostToolInput = z.object({ 
  html: z.string().optional(), 
  url: z.string().optional(), 
  text: z.string().optional() 
});

export async function executePostToolDetect(): Promise<void> {
  const raw = await readStdinInput();
  const data = PostToolInput.safeParse(JSON.parse(raw||"{}")); 
  const policy = loadPolicy();
  const combined = (data.success && (data.data.html || data.data.text) || "").toLowerCase();
  const pause: string[] = policy.actions?.pause_keywords || [];
  
  if (pause.some((kw:string)=> combined.includes(kw.toLowerCase()))) {
    // Note: console.log is intentional - MCP protocol output
    return console.log(JSON.stringify({ 
      decision:"pause_for_human", 
      reason:"可能遇到登录/付费墙/验证码" 
    }));
  }
  
  // Note: console.log is intentional - MCP protocol output
  console.log(JSON.stringify({ decision:"ok" }));
}

// Stop checkpoint logic
export async function executeStopCheckpoint(): Promise<void> { 
  // Note: console.log is intentional - MCP protocol output
  console.log(JSON.stringify({ 
    message: "到达检查点：请确认计划/证据/取舍后继续（/resume 或给出指示）。" 
  })); 
}

// Helper function to read stdin
async function readStdinInput(): Promise<string> {
  return new Promise<string>(resolve => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => buffer += chunk);
    process.stdin.on('end', () => resolve(buffer));
  });
}