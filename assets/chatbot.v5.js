(function(){
  const BTN_ID='c2c-chat-cta'; const PANEL_ID='c2c-chatbot-container';
  const byId=id=>document.getElementById(id);

  function showPanel(show){
    const panel=byId(PANEL_ID), btn=byId(BTN_ID);
    if(!panel||!btn)return;
    if(show){ panel.removeAttribute('hidden'); btn.setAttribute('aria-expanded','true'); }
    else{ panel.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); }
  }
  function toggle(){ const panel=byId(PANEL_ID); if(!panel)return; showPanel(panel.hasAttribute('hidden')); }
  function docClick(e){ const p=byId(PANEL_ID), b=byId(BTN_ID); if(!p||!b)return;
    if(!p.hasAttribute('hidden') && !p.contains(e.target) && e.target!==b && !b.contains(e.target)){ showPanel(false); } }
  function keyEsc(e){ if(e.key==='Escape') showPanel(false); }
  function bind(){ const btn=byId(BTN_ID); if(!btn)return;
    btn.addEventListener('click',toggle); document.addEventListener('click',docClick); document.addEventListener('keydown',keyEsc);
    const panel=byId(PANEL_ID); if(panel){ const iframe=panel.querySelector('iframe');
      if(iframe && iframe.src==='about:blank'){ iframe.srcdoc='<style>body{margin:0;background:#0f0f0f;color:#fff;display:grid;place-items:center;font:14px system-ui}</style><div>👋 C2C chat loads here.</div>'; } } }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',bind); } else{ bind(); }
})();
