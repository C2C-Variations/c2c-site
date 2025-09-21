// scripts/link_check.mjs
// Node 20+ only (uses global fetch). No external deps.
// Scans data/resources.json (+ optional resources.html) for http(s) links,
// attempts HEAD then GET (fallback), follows redirects, and writes link_audit.csv.

import { readFile, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const args = new Map(process.argv.slice(2).map((a) => {
  const [k, ...rest] = a.split("=");
  return [k.replace(/^--/,""), rest.join("=")];
}));

const BASE_URL   = args.get("base") || process.env.BASE_URL || "";
const JSON_PATH  = args.get("json") || "data/resources.json";
const HTML_PATH  = args.get("html") || "resources.html";
const OUT_CSV    = args.get("out")  || "link_audit.csv";
const TIMEOUT_MS = Number(args.get("timeout") || 15000);
const MAX_CONC   = Number(args.get("concurrency") || 10);

function isHttpish(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u.trim());
}
function resolveMaybeRelative(href) {
  try {
    if (isHttpish(href)) return new URL(href).toString();
    if (BASE_URL && href && !/^(mailto:|tel:|#|javascript:)/i.test(href)) {
      return new URL(href, BASE_URL).toString();
    }
  } catch (_) {}
  return null;
}

async function readJsonLinks(jsonFile) {
  const file = resolvePath(process.cwd(), jsonFile);
  let data;
  try {
    data = JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    console.warn(`[warn] Unable to read ${jsonFile}: ${e.message}`);
    return [];
  }
  const links = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
    else if (typeof v === "string") {
      const u = resolveMaybeRelative(v) || (isHttpish(v) ? v : null);
      if (u) links.add(u);
    }
  };
  walk(data);
  return [...links];
}

async function readHtmlLinks(htmlFile) {
  const links = new Set();
  try {
    const html = await readFile(resolvePath(process.cwd(), htmlFile), "utf8");
    // super simple href scan
    const re = /href\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html))) {
      const href = m[1];
      const u = resolveMaybeRelative(href) || (isHttpish(href) ? href : null);
      if (u) links.add(u);
    }
  } catch (e) {
    console.warn(`[warn] Unable to read ${htmlFile}: ${e.message}`);
  }
  return [...links];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function headOrGet(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res, err;
  // Try HEAD first
  try {
    res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(t);
    if (res.ok || res.status < 400) {
      return { method:"HEAD", status:res.status, finalUrl:res.url, ok: res.status < 400, error:null };
    }
    // Some servers block HEAD; fall through to GET
  } catch (e) {
    err = e.message || String(e);
  } finally {
    clearTimeout(t);
  }

  // GET fallback
  const controller2 = new AbortController();
  const t2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);
  try {
    res = await fetch(url, { method:"GET", redirect:"follow", signal: controller2.signal, headers: { "User-Agent":"c2c-link-check/1.0" }});
    clearTimeout(t2);
    return { method:"GET", status:res.status, finalUrl:res.url, ok: res.status < 400, error:null };
  } catch (e) {
    clearTimeout(t2);
    return { method:"GET", status:0, finalUrl:url, ok:false, error: err ? `HEAD:${err}; GET:${e.message}` : e.message };
  }
}

async function run() {
  const jsonLinks = await readJsonLinks(JSON_PATH);
  const htmlLinks = await readHtmlLinks(HTML_PATH);
  const all = [...new Set([...jsonLinks, ...htmlLinks])];

  console.log(`Found ${all.length} unique link(s). Checking with concurrency=${MAX_CONC} (timeout ${TIMEOUT_MS}ms)…`);

  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < all.length) {
      const i = idx++;
      const url = all[i];
      const r = await headOrGet(url);
      results.push({ original:url, ...r });
      // gentle pacing to avoid rate-limits
      await sleep(50);
    }
  }

  const workers = Array.from({length:Math.min(MAX_CONC, all.length)}, worker);
  await Promise.all(workers);

  // CSV
  const header = "original_url,final_url,method_used,status,ok,error\n";
  const rows = results.map(r =>
    [r.original, r.finalUrl, r.method, r.status, r.ok ? "true" : "false", (r.error||"").replace(/[\r\n,]+/g," ")].map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")
  );
  await writeFile(OUT_CSV, header + rows.join("\n"), "utf8");

  // Summary
  const ok = results.filter(r => r.ok).length;
  const fail = results.length - ok;
  console.log(`\nSummary: total=${results.length}, ok=${ok}, failed=${fail}`);
  if (fail) {
    console.log("First 10 failures:");
    results.filter(r => !r.ok).slice(0,10).forEach(r => {
      console.log(` - ${r.original} -> [${r.status}] ${r.finalUrl} ${r.error?` err=${r.error}`:""}`);
    });
  }
  console.log(`CSV written: ${OUT_CSV}`);
}

run().catch(e => {
  console.error("link_check failed:", e);
  process.exit(1);
});
