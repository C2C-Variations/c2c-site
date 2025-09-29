(function(){
  if (window.__C2C_RESOURCES_HUB__) {
    console.info('C2C Resources: already loaded');
    return;
  }
  window.__C2C_RESOURCES_HUB__ = true;

  const REGION_ORDER = ['all','national','vic','nsw','qld','sa','wa','tas','nt','act'];
  const REGION_META = {
    all: { label: 'All' },
    national: { label: 'National', synonyms: ['national','australia','aus'] },
    vic: { label: 'VIC', full: 'Victoria', synonyms: ['vic','victoria'], coord: [-37.8136, 144.9631] },
    nsw: { label: 'NSW', full: 'New South Wales', synonyms: ['nsw','new south wales'], coord: [-33.8688, 151.2093] },
    qld: { label: 'QLD', full: 'Queensland', synonyms: ['qld','queensland'], coord: [-27.4698, 153.0251] },
    sa:  { label: 'SA',  full: 'South Australia', synonyms: ['sa','south australia'], coord: [-34.9285, 138.6007] },
    wa:  { label: 'WA',  full: 'Western Australia', synonyms: ['wa','western australia'], coord: [-31.9523, 115.8613] },
    tas: { label: 'TAS', full: 'Tasmania', synonyms: ['tas','tasmania'], coord: [-42.8821, 147.3272] },
    nt:  { label: 'NT',  full: 'Northern Territory', synonyms: ['nt','northern territory','darwin'], coord: [-12.4634, 130.8456] },
    act: { label: 'ACT', full: 'Australian Capital Territory', synonyms: ['act','canberra','australian capital territory'], coord: [-35.2809, 149.1300] }
  };

  const DOC_WORDS = ['doc','docs','document','documents','template','templates','form','forms','pack','kit'];
  const DOC_EXTS = ['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.rtf'];

  const regionLookup = buildRegionLookup();
  const state = {
    host: null,
    counter: null,
    chips: new Map(),
    results: null,
    empty: null,
    activeRegion: 'all',
    all: []
  };

  console.info('C2C Resources BOOT');

  function buildRegionLookup(){
    const lookup = new Map();
    REGION_ORDER.forEach(id => {
      const meta = REGION_META[id];
      if (!meta) return;
      if (meta.label) lookup.set(meta.label.toLowerCase(), id);
      if (meta.full) lookup.set(meta.full.toLowerCase(), id);
      (meta.synonyms || []).forEach(name => lookup.set(String(name).toLowerCase(), id));
    });
    return lookup;
  }

  function normalise(value){
    return String(value || '').trim().toLowerCase();
  }

  function detectRegions(item){
    const matches = new Set();
    const tags = Array.isArray(item.tags) ? item.tags.map(normalise) : [];
    tags.forEach(tag => {
      const mapped = regionLookup.get(tag);
      if (mapped) matches.add(mapped);
    });

    const regionField = Array.isArray(item.regions) ? item.regions : (item.region ? [item.region] : []);
    regionField.map(normalise).forEach(token => {
      const mapped = regionLookup.get(token);
      if (mapped) matches.add(mapped);
    });

    const title = normalise(item.title);
    const subtitle = normalise(item.subtitle || item.summary || '');
    const url = normalise(item.url || item.href || '');

    REGION_ORDER.forEach(id => {
      if (id === 'all') return;
      const meta = REGION_META[id];
      const candidates = (meta.synonyms || []);
      if (!candidates.length) return;
      const pattern = new RegExp('\\b(' + candidates.map(escapeRegExp).join('|') + ')\\b', 'i');
      if (pattern.test(title) || pattern.test(subtitle) || pattern.test(url)) {
        matches.add(id);
      }
    });

    if (!matches.size) {
      matches.add('national');
    }

    return Array.from(matches);
  }

  function escapeRegExp(input){
    return String(input).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  }

  function isDocItem(item){
    const title = normalise(item.title);
    const subtitle = normalise(item.subtitle || item.summary || '');
    const url = normalise(item.url || item.href || '');
    const tags = Array.isArray(item.tags) ? item.tags.map(normalise) : [];

    if (DOC_WORDS.some(word => title.includes(word) || subtitle.includes(word))) return true;
    if (DOC_WORDS.some(word => tags.includes(word))) return true;
    if (DOC_EXTS.some(ext => url.endsWith(ext))) return true;
    if (/\b(doc|docs|document|template)s?\b/.test(url)) return true;
    return false;
  }

  function prepareItems(list){
    return list.map((item, index) => {
      const result = Object.assign({}, item);
      result.title = result.title || 'Untitled resource';
      result.url = result.url || result.href || '#';
      result.subtitle = result.subtitle || result.summary || '';
      result.category = (result.category || result.bucket || 'Other').trim() || 'Other';
      result.tags = Array.isArray(result.tags) ? result.tags.filter(Boolean) : [];
      result.__regions = detectRegions(result);
      result.__regionLabels = result.__regions
        .filter(id => id !== 'all')
        .map(id => REGION_META[id]?.label || REGION_META[id]?.full || id.toUpperCase());
      result.__id = result.id || `resource-${index}`;
      return result;
    });
  }

  function findNearestRegion(lat, lon){
    let bestId = 'national';
    let bestDistance = Number.POSITIVE_INFINITY;
    REGION_ORDER.forEach(id => {
      if (id === 'all' || id === 'national') return;
      const meta = REGION_META[id];
      if (!meta || !meta.coord) return;
      const distance = haversine(lat, lon, meta.coord[0], meta.coord[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = id;
      }
    });
    return bestId;
  }

  function haversine(lat1, lon1, lat2, lon2){
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function buildDOM(host){
    console.info('C2C Resources: setupDOM start');
    host.classList.add('resources-root');
    host.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'resources-toolbar';

    const chipsRow = document.createElement('div');
    chipsRow.className = 'resource-chip-row';

    const geoBtn = document.createElement('button');
    geoBtn.type = 'button';
    geoBtn.className = 'resource-chip resource-chip--action';
    geoBtn.dataset.action = 'geo';
    geoBtn.textContent = 'Use my location';
    chipsRow.appendChild(geoBtn);

    REGION_ORDER.forEach(id => {
      const meta = REGION_META[id];
      if (!meta) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'resource-chip';
      chip.dataset.region = id;
      chip.textContent = meta.label || meta.full || id.toUpperCase();
      chip.setAttribute('aria-pressed', 'false');
      chipsRow.appendChild(chip);
      state.chips.set(id, chip);
    });

    const counter = document.createElement('p');
    counter.className = 'resource-counter';
    counter.textContent = 'Loading resources…';

    toolbar.appendChild(chipsRow);
    toolbar.appendChild(counter);

    const results = document.createElement('div');
    results.className = 'resource-groups';

    const empty = document.createElement('div');
    empty.className = 'resource-empty';
    empty.textContent = 'No resources match this region yet. Try selecting All or National.';
    empty.hidden = true;

    host.appendChild(toolbar);
    host.appendChild(results);
    host.appendChild(empty);

    state.host = host;
    state.counter = counter;
    state.results = results;
    state.empty = empty;

    if (state.chips.has('all')) {
      const allChip = state.chips.get('all');
      allChip.classList.add('is-active');
      allChip.setAttribute('aria-pressed', 'true');
    }

    chipsRow.addEventListener('click', function(event){
      const chip = event.target.closest('.resource-chip');
      if (!chip) return;
      if (chip.dataset.action === 'geo') {
        requestGeo(chip);
        return;
      }
      const region = chip.dataset.region;
      if (region) {
        setRegion(region);
      }
    });
  }

  function setRegion(id){
    if (!state.chips.has(id)) return;
    if (state.activeRegion === id) return;
    state.activeRegion = id;
    state.chips.forEach((chip, key) => {
      const active = key === id;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    render(false);
  }

  function requestGeo(button){
    if (!navigator.geolocation) {
      console.warn('C2C Resources: geolocation unavailable');
      button.disabled = true;
      return;
    }
    console.info('C2C Resources: geo request');
    button.disabled = true;
    button.classList.add('is-busy');
    navigator.geolocation.getCurrentPosition(function(position){
      const { latitude, longitude } = position.coords;
      console.info('C2C Resources: geo success', latitude, longitude);
      const region = findNearestRegion(latitude, longitude);
      if (region) {
        state.activeRegion = region;
        state.chips.forEach((chip, key) => {
          const active = key === region;
          chip.classList.toggle('is-active', active);
          chip.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        render(false);
      }
      button.disabled = false;
      button.classList.remove('is-busy');
    }, function(error){
      console.warn('C2C Resources: geo denied', error && error.message ? error.message : error);
      button.disabled = false;
      button.classList.remove('is-busy');
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  }

  function filterByRegion(items, regionId){
    if (regionId === 'all') return items;
    return items.filter(item => item.__regions.includes(regionId) || item.__regions.includes('national'));
  }

  function render(reset){
    if (!state.results) return;
    const visible = filterByRegion(state.all, state.activeRegion);
    state.counter.textContent = `Showing ${visible.length} of ${state.all.length} resources`;
    state.results.innerHTML = '';

    if (!visible.length) {
      state.empty.hidden = false;
      console.info(`C2C Resources: apply rendering ${visible.length} resetLimits=${reset === false ? 'false' : 'true'}`);
      return;
    }

    state.empty.hidden = true;

    const byCategory = new Map();
    visible.forEach(item => {
      const key = item.category || 'Other';
      if (!byCategory.has(key)) {
        byCategory.set(key, []);
      }
      byCategory.get(key).push(item);
    });

    Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b)).forEach(category => {
      const section = document.createElement('section');
      section.className = 'resource-category';

      const heading = document.createElement('h2');
      heading.className = 'resource-category__title';
      heading.textContent = category;
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'resource-grid';

      byCategory.get(category).forEach(item => {
        const card = document.createElement('a');
        card.className = 'resource-card';
        card.href = item.url;
        card.target = '_blank';
        card.rel = 'noopener';

        const title = document.createElement('h3');
        title.textContent = item.title;
        card.appendChild(title);

        if (item.subtitle) {
          const blurb = document.createElement('p');
          blurb.className = 'resource-card__meta';
          blurb.textContent = item.subtitle;
          card.appendChild(blurb);
        } else if (item.tags && item.tags.length) {
          const blurb = document.createElement('p');
          blurb.className = 'resource-card__meta';
          blurb.textContent = item.tags.join(', ');
          card.appendChild(blurb);
        }

        if (state.activeRegion === 'all' && item.__regionLabels.length) {
          const badge = document.createElement('span');
          badge.className = 'resource-card__region';
          badge.textContent = item.__regionLabels.join(', ');
          card.appendChild(badge);
        }

        const cta = document.createElement('span');
        cta.className = 'resource-card__cta';
        cta.textContent = 'Open resource';
        card.appendChild(cta);

        grid.appendChild(card);
      });

      section.appendChild(grid);
      state.results.appendChild(section);
    });

    console.info(`C2C Resources: apply rendering ${visible.length} resetLimits=${reset === false ? 'false' : 'true'}`);
  }

  function toArray(payload){
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return [];
  }

  async function fetchJSON(url){
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response.json();
  }

  async function loadData(host){
    const primary = host.dataset.source || '/assets/data/resources.json';
    const fallback = host.dataset.sourceFallback || '/site/assets/data/resources.json';

    try {
      const payload = await fetchJSON(primary);
      return toArray(payload);
    } catch (primaryError) {
      console.warn('C2C Resources: primary fetch failed', primaryError);
      if (!fallback || fallback === primary) throw primaryError;
      const payload = await fetchJSON(fallback);
      return toArray(payload);
    }
  }

  async function boot(){
    const host = document.getElementById('resources-app');
    if (!host) return;

    buildDOM(host);

    try {
      const data = await loadData(host);
      console.info('C2C Resources: dataset size =', data.length);
      const filtered = data.filter(item => !isDocItem(item));
      console.info(`C2C Resources: docs removed = ${data.length - filtered.length} remaining = ${filtered.length}`);
      state.all = prepareItems(filtered);
      state.chips.forEach((chip, key) => {
        const active = key === state.activeRegion;
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      render(true);
    } catch (error) {
      console.error('C2C Resources: failed to load dataset', error);
      state.counter.textContent = 'Resources temporarily unavailable. Try again soon.';
      if (state.empty) {
        state.empty.hidden = false;
        state.empty.textContent = 'Resources temporarily unavailable. Try again soon.';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
