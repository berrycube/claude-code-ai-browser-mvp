import { z } from "zod"; import { loadPolicy } from "./policy.js";
const Input = z.object({ url: z.string().optional(), action: z.string().optional() });
async function main(){
  const raw = await new Promise<string>(r=>{let b='';process.stdin.setEncoding('utf8');process.stdin.on('data',d=>b+=d);process.stdin.on('end',()=>r(b));});
  const data = Input.safeParse(JSON.parse(raw||"{}")); const policy = loadPolicy();
  if (!data.success) return console.log(JSON.stringify({ permissionDecision:"ask", reason:"bad input" }));
  const url = data.data.url || ""; const deny = policy.actions?.deny_domains||[]; const ask = policy.actions?.ask_patterns||[];
  if (deny.some((d:string)=> url.includes(d))) return console.log(JSON.stringify({ permissionDecision:"deny", reason:"blocked domain" }));
  if (ask.some((p:string)=> new RegExp(p,'i').test(url))) return console.log(JSON.stringify({ permissionDecision:"ask", reason:"sensitive pattern" }));
  console.log(JSON.stringify({ permissionDecision:"allow", reason:"ok" }));
} main();
