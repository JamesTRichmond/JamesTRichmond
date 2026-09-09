import { chromium } from "playwright";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const [,, SIZE, FPS, OUT] = process.argv;
const ROOT="/home/claude/thor";
const MIME={".html":"text/html",".js":"text/javascript",".png":"image/png"};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split("?")[0]);if(p==="/")p="/index.html";const f=path.join(ROOT,p);if(!fs.existsSync(f)){s.writeHead(404);return s.end();}s.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream"});fs.createReadStream(f).pipe(s);});
await new Promise(r=>server.listen(8902,r));
const b=await chromium.launch({args:["--use-gl=swiftshader","--enable-unsafe-swiftshader"]});
const p=await (await b.newContext({viewport:{width:200,height:200}})).newPage();
p.on("pageerror",e=>console.log("PAGEERROR",e.message));
await p.goto(`http://127.0.0.1:8902/?static&size=${SIZE}&crop=${process.env.CROP||"full"}&loop=${process.env.LOOP||8}&cycles=${process.env.CYCLES||2}`,{waitUntil:"domcontentloaded"});
await p.waitForFunction(()=>window.__ready===true,{timeout:30000});
const loop = await p.evaluate(()=>window.__thor.loop);
const n = Math.round(loop * FPS);
fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
const t0 = Date.now();
for (let i=0;i<n;i++) {
  const u = await p.evaluate(tt => { window.__thor.drawAt(tt); return document.querySelector("#c").toDataURL("image/png"); }, i/FPS);
  fs.writeFileSync(`${OUT}/f${String(i).padStart(3,"0")}.png`, Buffer.from(u.split(",")[1],"base64"));
  if (i % 24 === 0) console.log(`  ${i}/${n}  ${((Date.now()-t0)/1000).toFixed(0)}s`);
}
console.log(`${n} frames at ${SIZE}px, ${FPS}fps, loop ${loop}s — ${((Date.now()-t0)/1000).toFixed(0)}s total`);
await b.close(); server.close();
