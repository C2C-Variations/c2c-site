console.info("C2C Resources BOOT");
console.log("C2C Resources: dataset URL =", document.getElementById("resources-app")?.dataset?.source);
(function () {
  "use strict";

  const DEFAULT_LIMIT = 60;
  const GENERAL_BUCKET = "General Tools";
  const BUCKETS = [
    { key: "Featured", label: "Featured", defaultOpen: true, featured: true },
    { key: "Emergency & Alerts", label: "Emergency & Alerts", defaultOpen: true },
    { key: "Traffic & Transport", label: "Traffic & Transport", defaultOpen: false },
    { key: "Utilities & Outages", label: "Utilities & Outages", defaultOpen: false },
    { key: "Planning & Councils", label: "Planning & Councils", defaultOpen: false },
    { key: "Health & Services", label: "Health & Services", defaultOpen: false },
    { key: "General Tools", label: "General Tools", defaultOpen: false }
  ];

  const elements = {
    search: document.getElementById("resources-search"),
    counter: document.getElementById("resources-counter"),
    featuredContainer: document.getElementById("resources-featured"),
    allContainer: document.getElementById("resources-all"),
  };

  const featuredHeading = elements.featuredContainer && elements.featuredContainer.previousElementSibling;

  const state = {
    all: [],
    q: "",
    lastQuery: "",
  };

  const renderConfig = new Map();
  let badgeRegistry = new Map();
  let linkReport = new Map();
  let linkReportCheckedAt = null;

  function absoluteUrl(url) {
    try {
      if (!url) return "";
      if (/^https?:/i.test(url)) return new URL(url).toString();
      return new URL(url, "https://www.c2cvariations.com.au").toString();
    } catch (error) {
      return "";
    }
  }

  function prepareResources(list) {
    return list.map(item => {
      const clone = { ...item };
      const bucket = clone.featured ? "Featured" : (clone.bucket || GENERAL_BUCKET);
      clone.bucket = bucket;
      clone.absoluteUrl = absoluteUrl(clone.url);
      clone.host = clone.absoluteUrl ? new URL(clone.absoluteUrl).host : "";
      const textBits = [clone.title, clone.summary, clone.description, clone.bucket, clone.group, clone.category, clone.url];
      if (Array.isArray(clone.tags)) {
        textBits.push(clone.tags.join(" "));
      }
      clone.searchText = textBits.filter(Boolean).join(" ").toLowerCase();
      return clone;
    });
  }

  function setupDOM() {
    if (elements.allContainer) {
      elements.allContainer.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "res-groups";
      elements.allContainer.appendChild(wrapper);

      BUCKETS.filter(b => !b.featured).forEach(bucket => {
        const config = createGroup(wrapper, bucket);
        renderConfig.set(bucket.key, config);
      });
    }

    if (elements.featuredContainer) {
      const loadMore = document.createElement("button");
      loadMore.type = "button";
      loadMore.className = "res-group__load";
      loadMore.hidden = true;
      loadMore.addEventListener("click", () => {
        const cfg = renderConfig.get("Featured");
        if (!cfg) return;
        cfg.limit = Math.min(cfg.limit + DEFAULT_LIMIT, cfg.currentItems.length);
        renderBucket("Featured", cfg.currentItems, false);
      });
      elements.featuredContainer.after(loadMore);

      renderConfig.set("Featured", {
        key: "Featured",
        label: "Featured",
        container: elements.featuredContainer,
        heading: featuredHeading,
        loadMore,
        limit: DEFAULT_LIMIT,
        currentItems: [],
        alwaysExpanded: true,
      });
    }
  }

  function createGroup(parent, bucket) {
    const section = document.createElement("section");
    section.className = "res-group";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "res-group__head";
    button.id = `grp-head-${slug(bucket.key)}`;
    button.setAttribute("aria-expanded", bucket.defaultOpen ? "true" : "false");

    const titleWrap = document.createElement("span");
    titleWrap.className = "res-group__title";
    const labelEl = document.createElement("span");
    labelEl.className = "res-group__label";
    labelEl.textContent = bucket.label;
    const countEl = document.createElement("span");
    countEl.className = "res-group__count";
    countEl.textContent = "(0)";
    titleWrap.append(labelEl, countEl);
    button.appendChild(titleWrap);

    const body = document.createElement("div");
    body.className = "res-group__body";
    body.id = `grp-${slug(bucket.key)}`;
    body.setAttribute("role", "region");
    body.setAttribute("aria-labelledby", button.id);
    body.hidden = !bucket.defaultOpen;

    const loadMore = document.createElement("button");
    loadMore.type = "button";
    loadMore.className = "res-group__load";
    loadMore.hidden = true;
    loadMore.addEventListener("click", () => {
      const cfg = renderConfig.get(bucket.key);
      if (!cfg) return;
      cfg.limit = Math.min(cfg.limit + DEFAULT_LIMIT, cfg.currentItems.length);
      renderBucket(bucket.key, cfg.currentItems, false);
    });

    button.addEventListener("click", () => toggleGroup(bucket.key));

    section.append(button, body, loadMore);
    parent.appendChild(section);

    return {
      key: bucket.key,
      label: bucket.label,
      button,
      body,
      loadMore,
      section,
      countEl,
      limit: DEFAULT_LIMIT,
      currentItems: [],
      defaultOpen: bucket.defaultOpen,
      alwaysExpanded: false,
    };
  }

  function bindEvents() {
    if (elements.search) {
      elements.search.addEventListener("input", event => {
        state.q = event.target.value || "";
        apply(true);
      });
    }
  }

  function toggleGroup(key) {
    const config = renderConfig.get(key);
    if (!config || config.alwaysExpanded) return;
    const expanded = config.button.getAttribute("aria-expanded") === "true";
    config.button.setAttribute("aria-expanded", expanded ? "false" : "true");
    config.body.hidden = expanded;
  }

  function matchesItem(item, query) {
    if (!query) return true;
    return item.searchText.includes(query);
  }

  function apply(resetLimits) {
    const query = (state.q || "").trim().toLowerCase();
    const queryChanged = query !== state.lastQuery;
    state.lastQuery = query;

    if (resetLimits || queryChanged) {
      renderConfig.forEach(config => {
        config.limit = DEFAULT_LIMIT;
      });
    }

    badgeRegistry = new Map();

    const filtered = state.all.filter(item => matchesItem(item, query));
    const grouped = new Map();

    filtered.forEach(item => {
      const bucket = item.featured ? "Featured" : (item.bucket || GENERAL_BUCKET);
      if (!grouped.has(bucket)) grouped.set(bucket, []);
      grouped.get(bucket).push(item);
    });

    renderBucket("Featured", grouped.get("Featured") || [], resetLimits || queryChanged);

    BUCKETS.filter(b => !b.featured).forEach(bucket => {
      const items = grouped.get(bucket.key) || [];
      renderBucket(bucket.key, items, resetLimits || queryChanged);
    });

    if (elements.counter) {
      elements.counter.textContent = `Showing ${filtered.length} of ${state.all.length} resources`;
    }
  }

  function renderBucket(key, items, resetLimit) {
    const config = renderConfig.get(key);
    if (!config) return;

    config.currentItems = items;

    if (resetLimit) {
      config.limit = DEFAULT_LIMIT;
    }

    const limit = config.alwaysExpanded ? Math.min(config.limit, items.length) : Math.min(config.limit, items.length);

    if (config.body) {
      config.body.innerHTML = "";
    }
    if (config.container) {
      config.container.innerHTML = "";
    }

    const target = config.body || config.container;
    if (target) {
      const fragment = document.createDocumentFragment();
      items.slice(0, limit || items.length).forEach(item => {
        const cardEl = createCard(item);
        fragment.appendChild(cardEl);
      });
      target.appendChild(fragment);
    }

    const remaining = Math.max(items.length - (limit || items.length), 0);
    if (config.loadMore) {
      if (remaining > 0) {
        config.loadMore.hidden = false;
        config.loadMore.textContent = `Load more (${remaining})`;
      } else {
        config.loadMore.hidden = true;
      }
    }

    if (config.countEl) {
      config.countEl.textContent = `(${items.length})`;
    }
    if (config.heading) {
      config.heading.textContent = items.length ? `Featured (${items.length})` : "Featured";
      config.heading.style.display = items.length ? "" : "none";
    }

    if (config.section) {
      config.section.style.display = items.length ? "" : "none";
    }
    if (config.section) {
      config.section.style.display = items.length ? "" : "none";
    } else if (config.container && config.alwaysExpanded) {
      config.container.style.display = items.length ? "" : "none";
    }
  }

  function createCard(item) {
    const card = document.createElement("article");
    card.className = "res-card";
    card.dataset.id = item.id;

    const body = document.createElement("div");
    body.className = "res-card__body";

    const titleRow = document.createElement("div");
    titleRow.className = "res-card__title-row";

    const badge = createBadge(item);
    registerBadge(item, badge);
    titleRow.appendChild(badge);

    const title = document.createElement("h3");
    title.className = "res-card__title";
    const link = document.createElement("a");
    link.className = "res-card__link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.title;
    title.appendChild(link);
    titleRow.appendChild(title);

    body.appendChild(titleRow);

    if (item.summary) {
      const summary = document.createElement("p");
      summary.className = "res-card__summary";
      summary.textContent = item.summary;
      body.appendChild(summary);
    }

    if (Array.isArray(item.tags) && item.tags.length) {
      const list = document.createElement("ul");
      list.className = "res-card__tags";
      item.tags.forEach(tag => {
        const li = document.createElement("li");
        li.textContent = tag;
        list.appendChild(li);
      });
      body.appendChild(list);
    }

    const actions = document.createElement("div");
    actions.className = "res-card__actions";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "js-open";
    openButton.textContent = "Open";
    openButton.addEventListener("click", () => {
      window.open(item.url, "_blank", "noopener,noreferrer");
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "js-copy";
    copyButton.textContent = "Copy link";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(absoluteUrl(item.url));
        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = "Copy link";
        }, 1200);
      } catch (error) {
        console.error(error);
      }
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "js-save";
    saveButton.textContent = "★ Save";
    saveButton.addEventListener("click", () => {
      try {
        const key = "c2c_saved";
        const set = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
        if (set.has(item.id || item.url)) {
          set.delete(item.id || item.url);
          saveButton.textContent = "★ Save";
        } else {
          set.add(item.id || item.url);
          saveButton.textContent = "Saved";
        }
        localStorage.setItem(key, JSON.stringify([...set]));
      } catch (error) {
        console.error(error);
      }
    });

    actions.append(openButton, copyButton, saveButton);
    body.appendChild(actions);
    card.appendChild(body);

    return card;
  }

  function createBadge() {
    const badge = document.createElement("span");
    badge.className = "res-card__badge badge-pending";
    const icon = document.createElement("span");
    icon.className = "res-card__badge-icon";
    icon.textContent = "●";
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = "Link status pending";
    badge.append(icon, sr);
    return badge;
  }

  function registerBadge(item, badgeEl) {
    badgeRegistry.set(item.id, { item, element: badgeEl });
    applyBadge(item, badgeEl);
  }

  function applyBadge(item, badgeEl) {
    const entry = linkReport.get(item.id);
    let statusClass = "badge-pending";
    let srText = "Link status pending";
    let title = "Link check pending";

    if (entry) {
      if (entry.error || !entry.status || entry.status >= 400) {
        statusClass = "badge-fail";
        srText = "Link currently failing";
        title = `Last check ${linkReportCheckedAt || ''} • ${entry.error || `HTTP ${entry.status}`}`.trim();
      } else {
        const finalHost = entry.finalUrl ? new URL(entry.finalUrl).host : item.host;
        const hostChanged = finalHost !== item.host;
        if (entry.redirects > 0 || hostChanged) {
          statusClass = "badge-warn";
          srText = hostChanged ? "Link redirects to another domain" : "Link redirects";
          title = `Last check ${linkReportCheckedAt || ''} • Redirects: ${entry.redirects}${hostChanged ? ` • Final host: ${finalHost}` : ''}`.trim();
        } else {
          statusClass = "badge-ok";
          srText = "Link healthy";
          title = `Last check ${linkReportCheckedAt || ''} • HTTP ${entry.status}`.trim();
        }
      }
    }

    badgeEl.className = `res-card__badge ${statusClass}`;
    badgeEl.setAttribute("title", title);
    const sr = badgeEl.querySelector(".sr-only");
    if (sr) sr.textContent = srText;
  }

  function refreshBadges() {
    badgeRegistry.forEach(record => {
      applyBadge(record.item, record.element);
    });
  }

  function loadLinkReport() {
    fetch("/assets/data/resources.linkreport.json", { cache: "no-store" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data || !Array.isArray(data.results)) return;
        linkReportCheckedAt = data.checkedAt || null;
        linkReport = new Map();
        data.results.forEach(entry => {
          linkReport.set(entry.id, entry);
        });
        refreshBadges();
      })
      .catch(() => {});
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function init() {
    const source = Array.isArray(window.C2C_RESOURCES) ? window.C2C_RESOURCES : [];
    state.all = prepareResources(source);
    setupDOM();
    bindEvents();
    apply(true);
    loadLinkReport();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


