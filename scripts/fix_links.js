#!/usr/bin/env node
const fs = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT_DIR, 'qa-e2e', 'out', 'link_audit.csv');
const REDIRECTS_PATH = path.join(ROOT_DIR, '_redirects');
const RESOURCES_PATH = path.join(ROOT_DIR, 'data', 'resources.json');
const INTERNAL_HOST_PATTERN = /(c2cvariations\.com\.au|c2cvariations\.com)$/i;

function parseCsv(content) {
  const rows = [];
  let current = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && content[i + 1] === '\n') {
        i += 1;
      }
      current.push(value);
      rows.push(current);
      current = [];
      value = '';
      continue;
    }

    if (char === ',' && !inQuotes) {
      current.push(value);
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value);
  }

  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

function toRecords(csvContent) {
  const rows = parseCsv(csvContent)
    .map((row) => row.map((cell) => (cell ?? '').trim()))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow;

  return dataRows.map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = row[index] ?? '';
      }
    });
    return record;
  });
}

function normaliseInternalPath(inputPath) {
  if (!inputPath) {
    return '/';
  }
  let pathOnly = inputPath.split(/[?#]/)[0] || '/';
  if (!pathOnly.startsWith('/')) {
    pathOnly = `/${pathOnly}`;
  }
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
    pathOnly = pathOnly.replace(/\/+$/, '');
    if (pathOnly === '') {
      pathOnly = '/';
    }
  }
  return pathOnly;
}

function expandUrlVariants(value) {
  const variants = new Set();
  if (!value) {
    return variants;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return variants;
  }

  variants.add(trimmed);
  const hasQueryOrHash = /[?#]/.test(trimmed);

  if (!hasQueryOrHash) {
    if (trimmed.endsWith('/')) {
      variants.add(trimmed.replace(/\/+$/, ''));
    } else {
      variants.add(`${trimmed}/`);
    }
  }

  try {
    const parsed = new URL(trimmed);
    const canonical = parsed.href;
    variants.add(canonical);

    if (!hasQueryOrHash) {
      const pathname = parsed.pathname || '/';
      const normalisedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
      const base = `${parsed.origin}${normalisedPath}`;
      variants.add(base);
      if (normalisedPath && normalisedPath !== pathname) {
        variants.add(`${base}/`);
      }
      if (normalisedPath === '') {
        variants.add(`${parsed.origin}/`);
      }
    }
  } catch (error) {
    // Ignore URLs we cannot parse.
  }

  return new Set(Array.from(variants).filter(Boolean));
}

function classifyUrl(urlValue) {
  if (!urlValue) {
    return null;
  }
  const trimmed = urlValue.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (INTERNAL_HOST_PATTERN.test(parsed.hostname)) {
      return { type: 'internal', path: normaliseInternalPath(parsed.pathname) };
    }
    return { type: 'external', url: parsed.href };
  } catch (error) {
    if (trimmed.startsWith('/')) {
      return { type: 'internal', path: normaliseInternalPath(trimmed) };
    }
  }
  return null;
}

async function loadCsvRecords() {
  if (!existsSync(CSV_PATH)) {
    throw new Error(`Missing link audit CSV at ${CSV_PATH}`);
  }
  const csv = await fs.readFile(CSV_PATH, 'utf8');
  return toRecords(csv);
}

async function updateRedirects(paths) {
  if (paths.size === 0) {
    return 0;
  }

  let existingContent = '';
  if (existsSync(REDIRECTS_PATH)) {
    existingContent = await fs.readFile(REDIRECTS_PATH, 'utf8');
  }
  const existingLines = existingContent
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  const seen = new Set(existingLines.map((line) => line.trim()));
  const additions = [];

  Array.from(paths)
    .sort()
    .forEach((pathValue) => {
      const line = `${pathValue}   /   302`;
      const signature = line.trim();
      if (!seen.has(signature)) {
        additions.push(line);
        seen.add(signature);
      }
    });

  if (additions.length === 0) {
    return 0;
  }

  const updatedLines = existingLines.concat(additions);
  const finalContent = `${updatedLines.join('\n')}\n`;
  await fs.writeFile(REDIRECTS_PATH, finalContent, 'utf8');
  return additions.length;
}

async function updateResources(disabledUrls) {
  if (disabledUrls.size === 0) {
    return 0;
  }
  if (!existsSync(RESOURCES_PATH)) {
    return 0;
  }

  const raw = await fs.readFile(RESOURCES_PATH, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse resources.json: ${error.message}`);
  }

  let changes = 0;
  let mutated = false;

  const visit = (node) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (typeof node.url === 'string') {
      const variants = expandUrlVariants(node.url);
      const matches = Array.from(variants).some((variant) => disabledUrls.has(variant));
      if (matches && node.disabled !== true) {
        node.disabled = true;
        changes += 1;
        mutated = true;
      }
    }

    Object.values(node).forEach(visit);
  };

  visit(data);

  if (mutated) {
    const output = `${JSON.stringify(data, null, 2)}\n`;
    await fs.writeFile(RESOURCES_PATH, output, 'utf8');
  }

  return changes;
}

async function main() {
  const records = await loadCsvRecords();
  if (records.length === 0) {
    console.log('No link audit records found. Nothing to do.');
    return;
  }

  const internalPaths = new Set();
  const brokenExternalUrls = new Set();

  records.forEach((record) => {
    const okValue = (record.ok || '').toLowerCase();
    const statusRaw = record.http_status || record.status || '';
    const status = Number.parseInt(statusRaw, 10);
    const isBrokenByOk = okValue === 'false';
    const isBrokenByStatus = Number.isFinite(status) && status >= 400;
    if (!isBrokenByOk && !isBrokenByStatus) {
      return;
    }

    const sources = ['original_url', 'final_url'];
    let internalCaptured = false;
    sources.forEach((key) => {
      const result = classifyUrl(record[key]);
      if (!result) {
        return;
      }

      if (result.type === 'internal' && !internalCaptured) {
        internalPaths.add(result.path);
        internalCaptured = true;
        return;
      }

      if (result.type === 'external') {
        expandUrlVariants(result.url).forEach((variant) => {
          brokenExternalUrls.add(variant);
        });
      }
    });
  });

  const redirectCount = await updateRedirects(internalPaths);
  const disabledCount = await updateResources(brokenExternalUrls);

  console.log(`Internal paths redirected: ${redirectCount}`);
  console.log(`External resources disabled: ${disabledCount}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
