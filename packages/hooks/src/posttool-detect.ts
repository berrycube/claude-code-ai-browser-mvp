import { z } from "zod"; import { loadPolicy } from "./policy.js";
const Input = z.object({ html: z.string().optional(), url: z.string().optional(), text: z.string().optional() });
async function main(){
  const raw = await new Promise<string>(r=>{let b='';process.stdin.setEncoding('utf8');process.stdin.on('data',d=>b+=d);process.stdin.on('end',()=>r(b));});
  const data = Input.safeParse(JSON.parse(raw||"{}")); const policy = loadPolicy();
  const combined = (data.success && (data.data.html || data.data.text) || "").toLowerCase();
  const pause: string[] = policy.actions?.pause_keywords || [];
  if (pause.some((kw:string)=> combined.includes(kw.toLowerCase()))) return console.log(JSON.stringify({ decision:"pause_for_human", reason:"可能遇到登录/付费墙/验证码" }));
  console.log(JSON.stringify({ decision:"ok" }));
} main();
