import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const DATA_FILE = path.resolve("assets/js/resources.data.js");
const SITE_ORIGIN = "https://www.c2cvariations.com.au";
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8000;
const USER_AGENT = "C2C-LinkCheck/1.0 (+https://www.c2cvariations.com.au)";

async function readResources(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: filePath });
  const resources = sandbox.window.C2C_RESOURCES;
  if (!Array.isArray(resources)) {
    throw new Error(`C2C_RESOURCES not found in ${filePath}`);
  }
  return resources.map(r => ({ ...r }));
}

function absoluteUrl(url) {
  if (!url) return "";
  try {
    if (/^https?:/i.test(url)) return new URL(url).toString();
    return new URL(url, SITE_ORIGIN).toString();
  } catch (error) {
    return "";
  }
}

async function fetchWithTimeout(resourceUrl, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(resourceUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT },
      ...options,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkUrl(item) {
  const firstUrl = absoluteUrl(item.url);
  if (!firstUrl) {
    return { id: item.id, status: null, finalUrl: "", error: "INVALID_URL", redirects: 0 };
  }

  let currentUrl = firstUrl;
  let method = "HEAD";
  let redirects = 0;
  let response = null;
  let error = null;

  while (redirects <= MAX_REDIRECTS) {
    try {
      response = await fetchWithTimeout(currentUrl, { method });
    } catch (err) {
      error = err.name === "AbortError" ? "TIMEOUT" : err.code || err.name;
      response = null;
    }

    if (!response) break;

    if (response.status === 405 || response.status === 403) {
      if (method === "HEAD") {
        method = "GET";
        continue;
      }
    }

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location && redirects < MAX_REDIRECTS) {
      redirects += 1;
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch (err) {
        error = "BAD_REDIRECT";
        break;
      }
      method = "HEAD";
      continue;
    }

    break;
  }

  const status = response ? response.status : null;
  if (!response && !error) {
    error = "NETWORK_ERROR";
  }

  return {
    id: item.id,
    status,
    finalUrl: response ? new URL(response.url || currentUrl, currentUrl).toString() : currentUrl,
    error,
    redirects,
  };
}

function summarise(results) {
  return results.reduce((acc, result) => {
    acc.total += 1;
    if (result.redirects > 0) acc.redirects += 1;
    if (result.status && result.status >= 200 && result.status < 400 && !result.error) {
      acc.ok += 1;
    } else {
      acc.fail += 1;
    }
    return acc;
  }, { total: 0, ok: 0, fail: 0, redirects: 0 });
}

async function main() {
  const resources = await readResources(DATA_FILE);
  const results = [];

  for (const resource of resources) {
    const result = await checkUrl(resource);
    results.push(result);
  }

  const checkedAt = new Date().toISOString();
  return {
    checkedAt,
    summary: summarise(results),
    results,
  };
}

const shouldSave = process.argv.includes("--save");

main()
  .then(async report => {
    const output = JSON.stringify(report, null, 2);
    if (shouldSave) {
      const target = path.resolve("assets/data/resources.linkreport.json");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, output + "\n");
      console.log("Saved report to", target);
    } else {
      console.log(output);
    }
  })
  .catch(error => {
    console.error("Link check failed:", error);
    process.exitCode = 1;
  });
