(function(){
  const BTN_ID='c2c-chat-cta', PANEL_ID='c2c-chatbot-container', OVERLAY_ID='c2c-chat-overlay', CLOSE_SEL='.c2c-chat-close';
  const $=id=>document.getElementById(id);
  const lock=s=>{document.documentElement.style.overflow=s?'hidden':'';document.body.style.overflow=s?'hidden':'';}
  function setExpanded(x){const b=$(BTN_ID);if(b)b.setAttribute('aria-expanded',x?'true':'false')}
  function show(x){
    const p=$(PANEL_ID), o=$(OVERLAY_ID); if(!p||!o) return;
    if(x){ o.hidden=false; p.hidden=false; setExpanded(true); lock(true); const c=p.querySelector(CLOSE_SEL); if(c) c.focus({preventScroll:true}); }
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
})();
