(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  const els = {
    search: $("#resources-search"),
    featured: $("#resources-featured"),
    all: $("#resources-all"),
    counter: $("#resources-counter"),
  };

  const state = {
    all: Array.isArray(window.C2C_RESOURCES) ? window.C2C_RESOURCES : [],
    filtered: [],
    q: ""
  };

  function normalize(s){ return (s || "").toString().toLowerCase(); }

  function matches(item, q) {
    if (!q) return true;
    const hay = [
      item.title,
      item.summary,
      ...(item.tags || []),
      item.url
    ].map(normalize).join(" ");
    return hay.includes(q);
  }

  function card(item){
    const el = document.createElement("article");
    el.className = "res-card";
    el.innerHTML = `
      <div class="res-card__body">
        <h3 class="res-card__title">
          <a class="res-card__link" href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
        </h3>
        ${item.summary ? `<p class="res-card__summary">${item.summary}</p>` : ""}
        ${Array.isArray(item.tags) && item.tags.length ? `<ul class="res-card__tags">${item.tags.map(t=>`<li>${t}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="res-card__actions">
        <button type="button" class="js-open">Open</button>
        <button type="button" class="js-copy">Copy link</button>
        <button type="button" class="js-save">★ Save</button>
      </div>
    `;
    el.querySelector(".js-open")?.addEventListener("click",()=>window.open(item.url,"_blank","noopener"));
    el.querySelector(".js-copy")?.addEventListener("click", async ()=>{
      try {
        await navigator.clipboard.writeText(item.url);
        const b = el.querySelector(".js-copy");
        if (b) {
          b.textContent = "Copied!";
          setTimeout(()=>{ b.textContent="Copy link"; },800);
        }
      } catch(e){ console.error(e); }
    });
    el.querySelector(".js-save")?.addEventListener("click", ()=>{
      try{
        const key="c2c_saved";
        const saved = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
        saved.add(item.id || item.url);
        localStorage.setItem(key, JSON.stringify([...saved]));
        const btn = el.querySelector(".js-save");
        if (btn) btn.textContent = "Saved";
      }catch(e){ console.error(e); }
    });
    return el;
  }

  function renderList(list, root){
    if (!root) return;
    root.innerHTML="";
    const frag = document.createDocumentFragment();
    list.forEach(i=>frag.appendChild(card(i)));
    root.appendChild(frag);
  }

  function updateCounter(visible,total){
    if (els.counter) els.counter.textContent = `Showing ${visible} of ${total}`;
  }

  function apply(){
    const q = normalize(state.q);
    const filtered = state.all.filter(i=>matches(i,q));
    const featured = filtered.filter(i=>i.featured);
    const rest = filtered.filter(i=>!i.featured);

    if (els.featured) renderList(featured, els.featured);
    if (els.all) renderList(rest, els.all);
    updateCounter(filtered.length, state.all.length);
  }

  function syncFromURL(){
    const url = new URL(location.href);
    const q = url.searchParams.get("q") || url.hash.replace(/^#q=/,"");
    if (q && els.search) els.search.value = q;
    state.q = q || "";
  }
  function syncToURL(){
    const url = new URL(location.href);
    if (state.q) url.searchParams.set("q", state.q);
    else url.searchParams.delete("q");
    history.replaceState(null,"",url);
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    if (!state.all.length){
      console.warn("C2C_RESOURCES empty; nothing to render.");
      return;
    }
    syncFromURL();
    apply();
    els.search?.addEventListener("input",(e)=>{
      state.q = e.target.value.trim();
      apply();
      syncToURL();
    });
  });
})();
