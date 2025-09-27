import fs from "fs";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

const DEFAULT_START = "https://www.c2cvariations.com.au/";
const args = process.argv.slice(2);
let start = DEFAULT_START;
let label = null;

for (const arg of args) {
  if (/^https?:/i.test(arg)) {
    start = arg;
  } else if (!label) {
    label = arg;
  }
}

const START = start;
const ORIGIN = new URL(START).origin;
const MAX_PAGES = 2000;
const RATE_MS = 150;
const UA = "C2CSpider/1.0 (+https://www.c2cvariations.com.au/)";

const seen = new Set();
const queue = [START];
const pages = [];
const assets = new Set();
const docs = [];

const DOC_EXTS = [".pdf",".doc",".docx",".xls",".xlsx",".ppt",".pptx",".csv",".rtf",".odt"];

function isInternal(u){ try{ return new URL(u, ORIGIN).origin === ORIGIN; }catch{ return false; } }
function norm(u){ return new URL(u, ORIGIN).toString().replace(/#.*$/,"" ); }
function titleOf(html){ const m=html.match(/<title[^>]*>([^<]*)<\/title>/i); return m?m[1].trim():""; }
function extOf(u){ try{ const {pathname}=new URL(u); return pathname.toLowerCase().match(/\.[a-z0-9]+$/)?.[0]||""; }catch{ return ""; } }
function extractLinks(html,base){ const out=[]; const re=/<(a|link|script|img)\b[^>]*?(href|src)=["']([^"']+)["']/gi; let m; while((m=re.exec(html))){ try{ out.push(new URL(m[3],base).toString()); }catch{} } return out; }
async function fetchText(u){ const r=await fetch(u,{headers:{"user-agent":UA,"accept":"text/html,*/*;q=0.8"}}); const ct=r.headers.get("content-type")||""; const status=r.status; const body=ct.includes("text/html")?await r.text():""; return {status,ct,body}; }

while(queue.length && pages.length<MAX_PAGES){
  const url = queue.shift(); if(seen.has(url)) continue; seen.add(url); if(!isInternal(url)) continue;
  try{
    const {status,ct,body}=await fetchText(url);
    const rec={url,status,contentType:ct};
    if(ct.includes("text/html")&&body){
      rec.title = titleOf(body);
      const links = extractLinks(body,url); rec.links = links;
      for(const l of links){
        const e=extOf(l);
        if(isInternal(l)){ const n=norm(l); if(!seen.has(n)) queue.push(n); }
        if(e && !e.match(/\.html?$/)){ assets.add(norm(l)); if(DOC_EXTS.includes(e)) docs.push({url:norm(l),ext:e,sourcePage:url}); }
      }
    }
    pages.push(rec);
  }catch(e){ pages.push({url,status:0,contentType:"",error:String(e)}); }
  await sleep(RATE_MS);
}

const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const outName = label ? label : `crawl-${stamp}`;
const outDir=path.join("audits", outName);
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,"sitemap.csv"),["url,status,contentType,title",...pages.map(p=>`"${p.url}",${p.status},"${p.contentType||""}","${(p.title||"").replace(/"/g,'""')}"`)].join("\n"));
fs.writeFileSync(path.join(outDir,"assets.csv"),["url",...assets].join("\n"));
fs.writeFileSync(path.join(outDir,"docs.csv"),["url,ext,sourcePage",...docs.map(d=>`"${d.url}",${d.ext},"${d.sourcePage}"`)].join("\n"));
fs.writeFileSync(path.join(outDir,"pages.json"),JSON.stringify(pages,null,2));
console.log("Crawl complete:",`pages=${pages.length}`,`assets=${assets.size}`,`docs=${docs.length}`,`out=${outDir}`);
