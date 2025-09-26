import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

const FILES = [
  path.resolve('assets/js/resources.data.js'),
  path.resolve('site/assets/js/resources.data.js')
];

const BUCKETS = [
  { name: 'Emergency & Alerts', keywords: ['emergency','alert','warning','hazard','incident','fire','flood','storm','tsunami','disaster','bushfire','cyclone','emerg'] },
  { name: 'Traffic & Transport', keywords: ['traffic','road','transport','rail','train','bus','tram','ferry','travel','maritime','port','flight','aviation'] },
  { name: 'Utilities & Outages', keywords: ['outage','power','electric','energy','water','gas','utility','telco','telecom','nbn','status','network','service status'] },
  { name: 'Planning & Councils', keywords: ['planning','council','development','permit','zoning','building','plan','application','da','consent','heritage'] },
  { name: 'Health & Services', keywords: ['health','medical','hospital','clinic','service','wellbeing','disease','covid','care','ambulance'] }
];

const OVERRIDES = new Map([
  ['var-template', 'General Tools'],
  ['swms-basic', 'General Tools'],
  ['gst-calculator', 'General Tools'],
  ['quote-reply', 'General Tools']
]);

function absoluteKeywords(resource) {
  const strings = [];
  ['title','summary','description','group','category'].forEach(key => {
    if (resource[key]) strings.push(String(resource[key]));
  });
  if (Array.isArray(resource.tags)) strings.push(resource.tags.join(' '));
  return strings.join(' ').toLowerCase();
}

function inferBucket(resource) {
  if (resource.featured) return 'Featured';
  if (resource.bucket) return resource.bucket;
  if (OVERRIDES.has(resource.id)) return OVERRIDES.get(resource.id);
  const haystack = absoluteKeywords(resource);
  for (const bucket of BUCKETS) {
    if (bucket.keywords.some(word => haystack.includes(word))) {
      return bucket.name;
    }
  }
  return 'General Tools';
}

async function loadResources(filePath) {
  const src = await fs.readFile(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { filename: filePath });
  const resources = sandbox.window.C2C_RESOURCES;
  if (!Array.isArray(resources)) {
    throw new Error('No resources array found in ' + filePath);
  }
  return resources.map(r => ({ ...r }));
}

function serialize(resources) {
  const json = JSON.stringify(resources, null, 2);
  return `window.C2C_RESOURCES = ${json};\nwindow.C2C_BUILD = window.C2C_BUILD || {};\nwindow.C2C_BUILD.resources = "data-loaded";\n`;
}

async function updateFile(filePath) {
  const resources = await loadResources(filePath);
  resources.forEach(resource => {
    resource.bucket = inferBucket(resource);
  });
  const output = serialize(resources);
  await fs.writeFile(filePath, output);
}

for (const file of FILES) {
  await updateFile(file);
}

console.log('Buckets updated for', FILES.length, 'files');
