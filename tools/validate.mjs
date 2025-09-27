import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PAGES = [
  "index.html",
  "pricing.html",
  "docs.html",
  "about.html",
  "privacy.html",
  "terms.html",
  "testimonials.html",
  "resources.html"
];

const MUST_HAVE = [
  "assets/css/site-header.css",
  "assets/js/site-enhancements.js",
  "WhatsApp",
  "Chat with C2C"
];

let failed = false;
for (const p of PAGES) {
  const file = path.join(ROOT, p);
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing page: ${p}`);
    failed = true;
    continue;
  }
  const html = fs.readFileSync(file, "utf8");

  for (const needle of MUST_HAVE) {
    if (!html.includes(needle)) {
      console.error(`❌ ${p}: missing "${needle}"`);
      failed = true;
    }
  }

  const headerCount = (html.match(/<header/gi) || []).length;
  if (headerCount !== 1) {
    console.error(`❌ ${p}: header count = ${headerCount}`);
    failed = true;
  }

  const headCount = (html.match(/<head>/gi) || []).length;
  if (headCount !== 1) {
    console.error(`❌ ${p}: head count = ${headCount}`);
    failed = true;
  }
}

if (failed) {
  console.error('❌ Validation failed.');
  process.exit(1);
}
console.log('✅ Validation passed.');
