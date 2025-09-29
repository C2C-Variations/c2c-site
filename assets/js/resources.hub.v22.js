if (window.__c2c_hub_loaded__) {
  console.info("C2C Resources: already loaded");
} else {
  window.__c2c_hub_loaded__ = true;

  const C2C_DOC_EXTS = new Set([".pdf",".doc",".docx",".xls",".xlsx",".ppt",".pptx",".odt",".rtf"]);
  const C2C_DOC_TAGS = new Set(["doc","docs","document","documents","template","templates","form","forms"]);

  function isDocItem(item){
    const title = (item?.title || '').toLowerCase();
    const url = (item?.url || item?.href || '').toLowerCase();
    const tags = Array.isArray(item?.tags) ? item.tags.map(tag => String(tag).toLowerCase()) : [];
    if (tags.some(tag => C2C_DOC_TAGS.has(tag))) return true;
    if (/\b(template|form|document|pack|kit)\b/.test(title)) return true;
    for (const ext of C2C_DOC_EXTS){ if (url.endsWith(ext)) return true; }
    if (url.includes('/docs/')) return true;
    return false;
  }
  const C2C_REGIONS = [
    { id: 'national', label: 'National', synonyms: ['national'] },
    { id: 'vic', label: 'Victoria', synonyms: ['vic', 'victoria'], coord: [-37.8136, 144.9631] },
    { id: 'nsw', label: 'New South Wales', synonyms: ['nsw', 'new south wales'], coord: [-33.8688, 151.2093] },
    { id: 'qld', label: 'Queensland', synonyms: ['qld', 'queensland'], coord: [-27.4698, 153.0251] },
    { id: 'wa',  label: 'Western Australia', synonyms: ['wa', 'western australia'], coord: [-31.9523, 115.8613] },
    { id: 'sa',  label: 'South Australia', synonyms: ['sa', 'south australia'], coord: [-34.9285, 138.6007] },
    { id: 'tas', label: 'Tasmania', synonyms: ['tas', 'tasmania'], coord: [-42.8821, 147.3272] },
    { id: 'nt',  label: 'Northern Territory', synonyms: ['nt', 'northern territory'], coord: [-12.4634, 130.8456] },
    { id: 'act', label: 'Australian Capital Territory', synonyms: ['act', 'australian capital territory'], coord: [-35.2809, 149.1300] },
  ];

  const C2C_REGION_IDS = new Set(C2C_REGIONS.map(r => r.id));
  const REGION_LOOKUP = new Map();
  const norm = value => String(value || '').toLowerCase();
  for (const region of C2C_REGIONS) {
    REGION_LOOKUP.set(norm(region.id), region.id);
    (region.synonyms || []).forEach(name => REGION_LOOKUP.set(norm(name), region.id));
  }

  function detectRegionsForItem(item) {
    if (!item) return 'national';
    const explicit = [];
    if (Array.isArray(item.regions)) explicit.push(...item.regions.map(norm));
    if (item.region) explicit.push(norm(item.region));
    for (const token of explicit) {
      const mapped = REGION_LOOKUP.get(token);
      if (mapped && mapped !== 'national') return mapped;
    }
    for (const token of explicit) {
      const mapped = REGION_LOOKUP.get(token);
      if (mapped === 'national') return 'national';
    }
    const tags = (item.tags || []).map(norm);
    for (const region of C2C_REGIONS) {
      if (region.id === 'national') continue;
      const hit = (region.synonyms || []).some(s => tags.includes(norm(s)));
      if (hit) return region.id;
    }
    if (tags.includes('national')) return 'national';
    return 'national';
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const toRad = d => d * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async function requestGeo() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject(new Error('no geolocation'));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    });
  }

  function nearestRegion(lat, lon) {
    let best = { id: 'national' };
    let bestD = Infinity;
    for (const region of C2C_REGIONS) {
      if (!region.coord) continue;
      const d = haversine(lat, lon, region.coord[0], region.coord[1]);
      if (d < bestD) {
        bestD = d;
        best = region;
      }
    }
    return best.id;
  }

  const state = window.C2C_STATE = window.C2C_STATE || {
    all: [],
    activeRegion: 'all',
    q: '',
    lastQuery: ''
  };

  console.info("C2C Resources BOOT");
  async function fetchJSON(u){const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status+" "+u);return r.json();}
  console.log("C2C Resources: dataset URL =", document.getElementById("resources-app")?.dataset?.source);

  (function () {
    "use strict";

    const elements = {
      search: document.getElementById("resources-search"),
      counter: document.getElementById("resources-counter"),
      host: document.getElementById("resources-app")
    };

    function setupDOM() {
      if (!elements.host) return null;
      let mount = elements.host.querySelector('#c2c-buckets');
      if (!mount) {
        mount = document.createElement('div');
        mount.id = 'c2c-buckets';
        mount.className = 'c2c-buckets';
        elements.host.appendChild(mount);
      }
      return mount;
    }

    function bindEvents() {
      if (elements.search) {
        elements.search.addEventListener('input', event => {
          state.q = event.target.value || '';
          apply();
        });
      }
    }

    function matchesItem(item, query) {
      if (!query) return true;
      return (item.searchText || '').includes(query);
    }

    function groupByRegionCategory(items) {
      const grouped = {};
      for (const region of C2C_REGIONS) {
        grouped[region.id] = {};
      }
      for (const item of items) {
        const regionId = item.__region || detectRegionsForItem(item);
        const cat = item.category || item.bucket || 'Other';
        grouped[regionId] ||= {};
        grouped[regionId][cat] ||= [];
        grouped[regionId][cat].push(item);
      }
      return grouped;
    }

    function renderToolbar(container) {
      const wrapper = document.createElement('div');
      wrapper.className = 'c2c-chips';

      const left = document.createElement('div');
      left.className = 'c2c-chips-left';
      const locBtn = document.createElement('button');
      locBtn.className = 'c2c-chip c2c-chip-geo';
      locBtn.textContent = 'Use my location';
      locBtn.addEventListener('click', async () => {
        try {
          const { lat, lon } = await requestGeo();
          const region = nearestRegion(lat, lon);
          console.log('C2C Resources: geo lat,lon=', lat, lon, '→ region=', region);
          state.activeRegion = region;
          apply();
        } catch (error) {
          console.warn('C2C Resources: geo failed', error?.message || error);
        }
      });
      left.appendChild(locBtn);

      const right = document.createElement('div');
      right.className = 'c2c-chips-right';

      const makeChip = (id, label) => {
        const btn = document.createElement('button');
        btn.className = 'c2c-chip';
        btn.dataset.region = id;
        btn.textContent = label;
        if (state.activeRegion === id) btn.classList.add('active');
        btn.addEventListener('click', () => {
          state.activeRegion = id;
          apply();
        });
        return btn;
      };

      right.appendChild(makeChip('all', 'All'));
      for (const region of C2C_REGIONS) {
        right.appendChild(makeChip(region.id, region.label));
      }

      wrapper.appendChild(left);
      wrapper.appendChild(right);
      container.appendChild(wrapper);
    }

    { // >>> C2C PATCH START: region render
  // Find a safe mount (works with old/new markup)
  const mount =
    document.querySelector("#c2c-buckets") ||
    document.querySelector("#resources-app") ||
    document.body;

  // Clear current view
  mount.innerHTML = "";

  // Group items by region using tags
  const grouped = groupByRegionCategory(items);

  // Render each region that has items
  for (const key of ["national","vic","nsw","qld","sa","wa","tas","nt","act"]) {
    const region = grouped[key];
    if (!region || !region.items.length) continue;

    // Region section
    const section = document.createElement("section");
    section.className = "resource-region";

    // Region header
    const h2 = document.createElement("h2");
    h2.className = "resource-region__title";
    h2.textContent = `${region.label}`;
    section.appendChild(h2);

    // Card list
    const list = document.createElement("div");
    list.className = "resource-list";

    for (const it of region.items) {
      const a = document.createElement("a");
      a.className = "resource-card";
      a.href = it.url || "#";
      a.target = "_blank";
      a.rel = "noopener";

      // Title + subtitle
      const title = document.createElement("div");
      title.className = "resource-card__title";
      title.textContent = it.title || "Untitled";

      const meta = document.createElement("div");
      meta.className = "resource-card__meta";
      meta.textContent = it.subtitle || (it.tags ? it.tags.join(", ") : "");

      a.appendChild(title);
      a.appendChild(meta);
      list.appendChild(a);
    }

    section.appendChild(list);
    mount.appendChild(section);
  }
} // <<< C2C PATCH END


    function apply() {
      const mount = setupDOM();
      if (!mount) return;
      const query = (state.q || '').trim().toLowerCase();
      if (query !== state.lastQuery) {
        state.lastQuery = query;
      }
      const filtered = state.all.filter(item => matchesItem(item, query));
      if (elements.counter) {
        elements.counter.textContent = `Showing ${filtered.length} of ${state.all.length} resources`;
      }
      console.log('C2C Resources: state.all =', state.all.length);
      renderBucketsByRegion(mount, filtered);
    }

    function prepareResources(list) {
      return (list || []).map(item => {
        const clone = { ...item };
        const textBits = [
          clone.title,
          clone.summary,
          clone.description,
          clone.desc,
          clone.category,
          clone.bucket,
          clone.group,
          clone.url,
          Array.isArray(clone.tags) ? clone.tags.join(' ') : ''
        ];
        clone.searchText = textBits.filter(Boolean).join(' ').toLowerCase();
        clone.__region = detectRegionsForItem(clone);
        return clone;
      });
    }

    async function init() {
      const host = elements.host;
      const dataSource = host?.dataset?.source;
      const fallback = host?.dataset?.sourceFallback;

      let data = Array.isArray(window.C2C_RESOURCES) ? window.C2C_RESOURCES : null;
      if (!data && dataSource) {
        try {
          const payload = await fetchJSON(dataSource);
          data = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        } catch (error) {
          console.warn('C2C Resources: source fetch failed', error);
        }
      }
      if (!data && fallback) {
        try {
          const payload = await fetchJSON(fallback);
          data = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        } catch (error) {
          console.warn('C2C Resources: fallback fetch failed', error);
        }
      }
      if (!Array.isArray(data)) data = [];

      console.info('C2C Resources: dataset size =', data.length);
      const before = data.length;
      const filtered = data.filter(item => !isDocItem(item));
      console.info('C2C Resources: docs removed =', before - filtered.length, 'remaining =', filtered.length);

      state.all = prepareResources(filtered);
      state.activeRegion = state.activeRegion || 'all';
      bindEvents();
      apply();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
}
