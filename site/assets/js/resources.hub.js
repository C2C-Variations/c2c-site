if (window.__c2c_hub_loaded__) { console.info("C2C Resources: already loaded"); }
else {
  window.__c2c_hub_loaded__ = true;

  const C2C_DOC_EXTS = new Set([".pdf",".doc",".docx",".xls",".xlsx",".ppt",".pptx",".odt",".rtf"]);
  const C2C_DOC_TAGS = new Set(["doc","docs","document","documents","template","templates","form","forms"]);
  const REGION_ORDER = ["NAT","VIC","NSW","QLD","SA","WA","TAS","NT","ACT"];
  const REGION_LABEL = {
    NAT: "National",
    VIC: "Victoria",
    NSW: "New South Wales",
    QLD: "Queensland",
    SA: "South Australia",
    WA: "Western Australia",
    TAS: "Tasmania",
    NT: "Northern Territory",
    ACT: "Australian Capital Territory",
  };
  const CAT_ORDER = [
    "Emergency & Alerts",
    "Health & Services",
    "Planning & Councils",
    "Traffic & Transport",
    "Safety",
    "Utilities & Outages",
    "Other",
  ];
  function isDocItem(it){
    const t = (it.title||"").toLowerCase();
    const u = (it.url||it.href||"").toLowerCase();
    const tags = (it.tags||[]).map(x=>String(x).toLowerCase());
    if (tags.some(x => C2C_DOC_TAGS.has(x))) return true;
    if (/\b(template|form|document|pack|kit)\b/.test(t)) return true;
    for (const ext of C2C_DOC_EXTS){ if (u.endsWith(ext)) return true; }
    if (u.includes("/docs/")) return true;
    return false;
  }

  console.info("C2C Resources BOOT");
  async function fetchJSON(u){const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status+" "+u);return r.json();}
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
      geo: null,
      activeRegions: [],
      regionChips: new Map(),
    };

    state.geo = state.geo ?? null;
    state.activeRegions = state.activeRegions ?? [];

    function requestGeo() {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        position => {
          state.geo = { lat: position.coords.latitude, lng: position.coords.longitude };
          console.log("C2C Resources: geo", state.geo);
          apply();
        },
        error => console.warn("C2C Resources: geo denied", error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    function resolveUrl(item) {
      const template = item.urlTemplate || item.url || item.href || "#";
      if (!item.urlTemplate || !state.geo) return template;
      const code = state.activeRegions.length === 1 ? state.activeRegions[0] : "NAT";
      return template
        .replace("{lat}", state.geo.lat)
        .replace("{lng}", state.geo.lng)
        .replace("{state}", code);
    }

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
      const mount = document.getElementById("resources-app");
      if (!mount) return;
      if (!mount.querySelector("#c2c-buckets")) {
        mount.insertAdjacentHTML("beforeend", '<div id="c2c-buckets" class="c2c-buckets"></div>');
        console.log("C2C Resources: injected #c2c-buckets");
      }
      const root = mount.querySelector("#c2c-buckets");
      if (!root) return;
      console.log("C2C Resources: setupDOM start");
      if (!root.querySelector(".c2c-toolbar")) {
        state.regionChips = new Map();
        const toolbar = document.createElement("div");
        toolbar.className = "c2c-toolbar";
        const geoBtn = document.createElement("button");
        geoBtn.type = "button";
        geoBtn.className = "c2c-chip";
        geoBtn.textContent = "Use my location";
        geoBtn.addEventListener("click", () => requestGeo());
        toolbar.appendChild(geoBtn);
        const row = document.createElement("div");
        row.className = "c2c-chip-row";
        const makeChip = (code, label) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "c2c-chip";
          btn.dataset.region = code;
          btn.textContent = label;
          btn.setAttribute("aria-pressed", "false");
          btn.addEventListener("click", () => {
            state.activeRegions = code === "ALL" ? [] : [code];
            apply();
          });
          state.regionChips.set(code, btn);
          return btn;
        };
        row.appendChild(makeChip("ALL", "All"));
        for (const region of REGION_ORDER) {
          row.appendChild(makeChip(region, REGION_LABEL[region] || region));
        }
        toolbar.appendChild(row);
        root.prepend(toolbar);
      } else {
        state.regionChips = new Map();
        root.querySelectorAll(".c2c-chip[data-region]").forEach(btn => {
          state.regionChips.set(btn.dataset.region || "", btn);
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

    function renderBucketsSimple(out, items) {
      if (!out) return;
      const esc = value => String(value ?? '').replace(/[&<>\"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
      const grouped = groupByRegionCategory(items || []);
      const regionOrder = [...REGION_ORDER, ...Object.keys(grouped).filter(key => !REGION_ORDER.includes(key)).sort((a, b) => a.localeCompare(b))];
      const orderedRegions = regionOrder.filter(region => grouped[region]);
      let html = '<div class=\"c2c-groups\">';
      if (!orderedRegions.length) {
        html += '<p class=\"c2c-empty\">No resources matched your filters.</p>';
      } else {
        for (const region of orderedRegions) {
          const categories = grouped[region] || {};
          const total = Object.values(categories).reduce((sum, list) => sum + list.length, 0);
          const label = REGION_LABEL[region] || region;
          html += `<section class=\"c2c-group\" data-region=\"${esc(region)}\">` +
            `<button class=\"c2c-accordion\" aria-expanded=\"true\">` +
              `<span class=\"c2c-group-title\">${esc(label)}</span>` +
              `<span class=\"c2c-count\">${total}</span>` +
            `</button>` +
            `<div class=\"c2c-region-body\">`;
          const categoryOrder = [...CAT_ORDER, ...Object.keys(categories).filter(cat => !CAT_ORDER.includes(cat)).sort((a, b) => a.localeCompare(b))];
          const seen = new Set();
          for (const category of categoryOrder) {
            if (seen.has(category)) continue;
            seen.add(category);
            const list = categories[category];
            if (!list || !list.length) continue;
            html += `<section class=\"c2c-category\" data-category=\"${esc(category)}\">` +
              `<h3 class=\"c2c-category-title\">${esc(category)}<span class=\"c2c-badge\">${list.length}</span></h3>` +
              '<ul class=\"c2c-cards\">' +
              list.map(item => {
                const link = resolveUrl(item);
                return `<li class=\"c2c-card\">` +
                  `<a class=\"c2c-card-link\" href=\"${esc(link)}\" rel=\"noopener\" target=\"_blank\">${esc(item.title || item.name || 'Untitled')}</a>` +
                  `${item.tags && item.tags.length ? `<div class=\"c2c-tags\">${item.tags.map(esc).join(', ')}</div>` : ''}` +
                `</li>`;
              }).join('') +
              '</ul>' +
            '</section>';
          }
          html += '</div></section>';
        }
      }
      html += '</div>';
      out.innerHTML = html;
      out.querySelectorAll('.c2c-accordion').forEach(btn => {
        btn.addEventListener('click', () => {
          const section = btn.closest('.c2c-group');
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!expanded));
          const body = section.querySelector('.c2c-region-body');
          if (body) body.hidden = expanded;
        }, { once: false });
      });
    }

    function apply(resetLimits) {
      const out = document.getElementById("c2c-buckets") || document.getElementById("resources-app");
      console.log("C2C Resources: apply rendering", Array.isArray(state?.all) ? state.all.length : 0, "resetLimits=", !!resetLimits);
      const query = (state.q || "").trim().toLowerCase();
      const queryChanged = query !== state.lastQuery;
      state.lastQuery = query;

      badgeRegistry = new Map();

      let filtered = state.all.filter(item => matchesItem(item, query));
      if (state.activeRegions.length) {
        const allowed = new Set(state.activeRegions);
        filtered = filtered.filter(item => {
          const regions = Array.isArray(item.regions) && item.regions.length ? item.regions : ['NAT'];
          return regions.some(region => allowed.has(region));
        });
      }

      if (elements.counter) {
        elements.counter.textContent = `Showing ${filtered.length} of ${state.all.length} resources`;
      }

      if (state.regionChips instanceof Map) {
        const hasActive = state.activeRegions.length > 0;
        state.regionChips.forEach((btn, code) => {
          const active = hasActive ? state.activeRegions.includes(code) : code === 'ALL';
          btn.classList.toggle('active', active);
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', String(active));
        });
      }

      if (out) {
        renderBucketsSimple(out, filtered);
      }

      if (out && (!out.innerHTML || out.innerHTML.trim() === '')) {
        renderBucketsSimple(out, Array.isArray(state.all) ? state.all : []);
        console.warn('C2C Resources: simple grouped renderer used');
      }
    }

    function renderBucketsSimple(out, items) {
      if (!out) return;
      const esc = value => String(value ?? '').replace(/[&<>\"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
      const grouped = groupByRegionCategory(items || []);
      const regionOrder = [...REGION_ORDER, ...Object.keys(grouped).filter(key => !REGION_ORDER.includes(key)).sort((a, b) => a.localeCompare(b))];
      const orderedRegions = regionOrder.filter(region => grouped[region]);
      let html = '<div class=\"c2c-groups\">';
      if (!orderedRegions.length) {
        html += '<p class=\"c2c-empty\">No resources matched your filters.</p>';
      } else {
        for (const region of orderedRegions) {
          const categories = grouped[region] || {};
          const total = Object.values(categories).reduce((sum, list) => sum + list.length, 0);
          const label = REGION_LABEL[region] || region;
          html += `<section class=\"c2c-group\" data-region=\"${esc(region)}\">` +
            `<button class=\"c2c-accordion\" aria-expanded=\"true\">` +
              `<span class=\"c2c-group-title\">${esc(label)}</span>` +
              `<span class=\"c2c-count\">${total}</span>` +
            `</button>` +
            `<div class=\"c2c-region-body\">`;
          const categoryOrder = [...CAT_ORDER, ...Object.keys(categories).filter(cat => !CAT_ORDER.includes(cat)).sort((a, b) => a.localeCompare(b))];
          const seen = new Set();
          for (const category of categoryOrder) {
            if (seen.has(category)) continue;
            seen.add(category);
            const list = categories[category];
            if (!list || !list.length) continue;
            html += `<section class=\"c2c-category\" data-category=\"${esc(category)}\">` +
              `<h3 class=\"c2c-category-title\">${esc(category)}<span class=\"c2c-badge\">${list.length}</span></h3>` +
              '<ul class=\"c2c-cards\">' +
              list.map(item => {
                const link = resolveUrl(item);
                return `<li class=\"c2c-card\">` +
                  `<a class=\"c2c-card-link\" href=\"${esc(link)}\" rel=\"noopener\" target=\"_blank\">${esc(item.title || item.name || 'Untitled')}</a>` +
                  `${item.tags && item.tags.length ? `<div class=\"c2c-tags\">${item.tags.map(esc).join(', ')}</div>` : ''}` +
                `</li>`;
              }).join('') +
              '</ul>' +
            '</section>';
          }
          html += '</div></section>';
        }
      }
      html += '</div>';
      out.innerHTML = html;
      out.querySelectorAll('.c2c-accordion').forEach(btn => {
        btn.addEventListener('click', () => {
          const section = btn.closest('.c2c-group');
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!expanded));
          const body = section.querySelector('.c2c-region-body');
          if (body) body.hidden = expanded;
        }, { once: false });
      });
    }

    function apply(resetLimits) {
      const out = document.getElementById("c2c-buckets") || document.getElementById("resources-app");
      console.log("C2C Resources: apply rendering", Array.isArray(state?.all) ? state.all.length : 0, "resetLimits=", !!resetLimits);
      const query = (state.q || "").trim().toLowerCase();
      const queryChanged = query !== state.lastQuery;
      state.lastQuery = query;

      badgeRegistry = new Map();

      const filtered = state.all.filter(item => matchesItem(item, query));

      if (elements.counter) {
        elements.counter.textContent = `Showing ${filtered.length} of ${state.all.length} resources`;
      }

      if (out) {
        renderBucketsSimple(out, filtered);
      }

      if (out && (!out.innerHTML || out.innerHTML.trim() === "")) {
        renderBucketsSimple(out, Array.isArray(state.all) ? state.all : []);
        console.warn("C2C Resources: simple grouped renderer used");
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

    async function init() {
      const mount = document.getElementById("resources-app");
      const ds = mount?.dataset?.source, ds2 = mount?.dataset?.sourceFallback;

      let DATA = (typeof window !== "undefined" && Array.isArray(window.C2C_RESOURCES)) ? window.C2C_RESOURCES : null;
      if (!DATA) {
        try {
          console.info("C2C Resources: fetching dataset", ds, "fallback", ds2);
          try { DATA = await fetchJSON(ds); }
          catch (e) { console.warn("primary dataset failed", e); DATA = ds2 ? await fetchJSON(ds2) : []; }
        } catch (e) {
          console.error("dataset fetch failed (both)", e);
          if (mount) mount.innerHTML = '<p class="error">Resource list temporarily unavailable.</p>';
          return;
        }
      }
      console.info("C2C Resources: dataset size =", DATA.length);

      const before = Array.isArray(DATA) ? DATA.length : 0;

      DATA = (Array.isArray(DATA) ? DATA : []).filter(it => !isDocItem(it));

      console.info("C2C Resources: docs removed =", before - DATA.length, "remaining =", DATA.length);

      state.all = prepareResources(Array.isArray(DATA) ? DATA : []);
      console.info("C2C Resources: state.all =", state.all.length);

      if (!window.__c2c_dom_ready__) {
        setupDOM();
        bindEvents();
        window.__c2c_dom_ready__ = true;
      } else {
        setupDOM();
      }

      apply(true);
      loadLinkReport();
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();



}
