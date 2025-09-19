
(function(){
  const BTN_ID='c2c-chat-cta', PANEL_ID='c2c-chatbot-container', OVERLAY_ID='c2c-chat-overlay', CLOSE_SEL='.c2c-chat-close';
  const $=id=>document.getElementById(id);
  const lock=s=>{document.documentElement.style.overflow=s?'hidden':'';document.body.style.overflow=s?'hidden':'';}

  // derive simple page context from <title> and path
  function pageContext(){
    const title = (document.title || '').trim();
    const path = location.pathname.replace(/\/+$/, '') || '/';
    let section = 'Home';
    if (path.includes('pricing')) section = 'Pricing';
    else if (path.includes('docs')) section = 'Docs';
    else if (path.includes('about')) section = 'About';
    else if (path.includes('partners')) section = 'Partners';
    else if (path.includes('privacy')) section = 'Privacy';
    else if (path.includes('terms')) section = 'Terms';
    return { section, title, path };
  }

  function setExpanded(x){const b=$(BTN_ID);if(b)b.setAttribute('aria-expanded',x?'true':'false')}
  function show(x){
    const p=$(PANEL_ID), o=$(OVERLAY_ID); if(!p||!o) return;
    if(x){
      o.hidden=false; p.hidden=false; setExpanded(true); lock(true);
      // Inject context into the panel once
      const ctx = pageContext();
      const body = p.querySelector('.c2c-chat-body');
      if (body && !body.querySelector('.c2c-ctx')) {
        const el = document.createElement('div');
        el.className = 'c2c-ctx';
        el.style.cssText = 'margin-top:8px;font-size:12px;color:#aaa;';
        el.textContent = `Context: ${ctx.section} • ${ctx.path}`;
        body.appendChild(el);
      }
      const c=p.querySelector(CLOSE_SEL); if(c) c.focus({preventScroll:true});
    }
    else { o.hidden=true;  p.hidden=true;  setExpanded(false);lock(false); }
  }
  function toggle(){ const p=$(PANEL_ID); if(!p)return; show(p.hidden) }
  function onDocClick(e){
    const p=$(PANEL_ID), o=$(OVERLAY_ID), b=$(BTN_ID); if(!p||!o) return;
    const hitPanel=p.contains(e.target), hitBtn=(b&&(e.target===b||b.contains(e.target))), hitOverlay=(e.target===o);
    if(!p.hidden && (hitOverlay || (!hitPanel && !hitBtn))) show(false);
  }
  function onKey(e){ if(e.key==='Escape') show(false) }
  function bind(){
    const b=$(BTN_ID), p=$(PANEL_ID); if(!b||!p) return;
    b.addEventListener('click',toggle);
    document.addEventListener('click',onDocClick);
    document.addEventListener('keydown',onKey);
    const c=p.querySelector(CLOSE_SEL); if(c) c.addEventListener('click',()=>show(false));
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',bind) } else { bind() }

  // lightweight analytics beacons
  function beacon(event, extra={}){
    try {
      const payload = JSON.stringify({
        event, page: location.pathname, ts: Date.now(), ...extra
      });
      navigator.sendBeacon?.('/analytics.txt', new Blob([payload],{type:'application/json'}));
    } catch {}
  }

  // hook into show/hide
  const _origShow = show;
  show = function(x){
    _origShow(x);
    beacon(x ? 'chat_open' : 'chat_close');
  };

})();
