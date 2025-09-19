(function () {
  const BTN_ID = "c2c-chat-cta";
  const PANEL_ID = "c2c-chatbot-container";

  const $ = sel => document.querySelector(sel);
  const byId = id => document.getElementById(id);

  function headerHeight(){
    // Try a few common header containers
    const header = $('header') || $('.site-header') || $('.header') || $('.nav') || $('.site-nav');
    if (!header) return 80; // safe default
    const rect = header.getBoundingClientRect();
    // Consider a second row (like your orange tabs) if immediately below
    // Grab element at y = rect.bottom+1 to see if there's a bar underneath
    let extra = 0;
    const elBelow = document.elementFromPoint(Math.min(window.innerWidth-1, 10), Math.min(rect.bottom+1, window.innerHeight-1));
    if (elBelow && elBelow !== header) {
      const belowRect = elBelow.getBoundingClientRect();
      if (belowRect.top >= rect.bottom && belowRect.height < 120) {
        extra = belowRect.height; // treat as second row height
      }
    }
    return Math.round(rect.bottom + extra + 12); // +12px breathing room
  }

  function placePanel(){
    const panel = byId(PANEL_ID);
    if (!panel) return;
    panel.style.top = headerHeight() + 'px';
  }

  function showPanel(show){
    const panel = byId(PANEL_ID);
    const btn = byId(BTN_ID);
    if (!panel || !btn) return;
    if (show){
      panel.removeAttribute('hidden');
      btn.setAttribute('aria-expanded','true');
      placePanel();
    }else{
      panel.setAttribute('hidden','');
      btn.setAttribute('aria-expanded','false');
    }
  }

  function togglePanel(){
    const panel = byId(PANEL_ID);
    if (!panel) return;
    showPanel(panel.hasAttribute('hidden'));
  }

  function onDocClick(e){
    const panel = byId(PANEL_ID);
    const btn   = byId(BTN_ID);
    if (!panel || !btn) return;
    const open = !panel.hasAttribute('hidden');
    if (!open) return;
    if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)){
      showPanel(false);
    }
  }

  function onKeyDown(e){
    if (e.key === 'Escape') showPanel(false);
  }

  function ensureIframe(){
    const panel = byId(PANEL_ID);
    if (!panel) return;
    const iframe = panel.querySelector('iframe');
    if (iframe && (iframe.src === '' || iframe.src === 'about:blank')){
      // TEMP placeholder; replace with your live chat endpoint when ready
      iframe.srcdoc = `
        <style>
          html,body{height:100%;margin:0;background:#0f0f0f;color:#fff;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;display:grid;place-items:center}
          .card{max-width:84%;text-align:center;opacity:.88}
          .pill{display:inline-block;padding:.25rem .6rem;border-radius:999px;background:#1d1d1d;border:1px solid #333;color:#aaa;margin-top:.5rem}
        </style>
        <div class="card">
          <div>👋 The C2C chat loads here.</div>
          <div class="pill">Backend connect next step</div>
        </div>`;
    }
  }

  function bind(){
    const btn = byId(BTN_ID);
    const panel = byId(PANEL_ID);
    if (!btn || !panel) return;

    btn.addEventListener('click', togglePanel, { once:false });
    document.addEventListener('click', onDocClick, { passive:true });
    document.addEventListener('keydown', onKeyDown);

    ensureIframe();
    placePanel();
    window.addEventListener('resize', placePanel);
    window.addEventListener('scroll', placePanel, { passive:true });

    console.log('[C2C] chat wired (v5)');
  }


  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bind);
  }else{
    bind();
  }
})();
