export default {
  async fetch(request, env, ctx) {
    const res = await env.ASSETS.fetch(request);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;

    const css = `:root{--c2c-orange:#FF7A00}
a[href^="https://buy.stripe.com"]{position:relative;z-index:9999;pointer-events:auto !important;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.backdrop,.overlay,.modal-backdrop,.menu-backdrop,.click-shield{pointer-events:none !important}
.nav-menu{display:none}.nav-menu.open{display:block}
header[role="banner"].is-fixed+main{padding-top:72px}`;

    const js = `(function(){
  // MOBILE MENU (targets your ids first)
  var hamburger = document.getElementById('nav-hamburger') 
               || document.querySelector('[data-nav-toggle], .hamburger, .menu-toggle, #menu-toggle, button[aria-label="Menu"]');
  var nav = document.getElementById('main-nav')
         || document.querySelector('[data-nav], nav .nav-menu, #nav, #mobile-menu, .nav-menu');

  if (hamburger && nav) {
    if(!nav.id) nav.id = 'c2c-nav';
    hamburger.setAttribute('aria-controls', nav.id);
    hamburger.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var open = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }, {passive:false});

    nav.addEventListener('click', function(e){
      var t=e.target; 
      if(t && (t.tagName==='A' || t.classList.contains('btn') || t.id==='c2c-chat-cta')){
        nav.classList.remove('open'); hamburger.setAttribute('aria-expanded','false');
      }
    });

    document.addEventListener('click', function(e){
      if (window.innerWidth>768) return;
      if (!nav.classList.contains('open')) return;
      if (!nav.contains(e.target) && e.target!==hamburger){
        nav.classList.remove('open'); hamburger.setAttribute('aria-expanded','false');
      }
    });
    window.addEventListener('resize', function(){
      if (window.innerWidth>768){
        nav.classList.remove('open'); hamburger.setAttribute('aria-expanded','false');
      }
    });
  }

  // STRIPE: handle <a>, <button>, data-href and inline onclick
  var STRIPE = 'https://buy.stripe.com';
  function go(href){ if(href) location.assign(href); }

  document.addEventListener('click', function(e){
    // normal anchors
    var el = e.target.closest && e.target.closest('a[href^="'+STRIPE+'"]');
    // buttons or custom elements
    if(!el) el = e.target.closest('[data-stripe],[data-href^="'+STRIPE+'"],[onclick*="buy.stripe.com"]');

    if(!el) return;
    e.preventDefault(); e.stopPropagation();

    var href = el.getAttribute && (el.getAttribute('href') || el.getAttribute('data-href') || el.getAttribute('data-stripe'));
    if(!href){
      var oc = el.getAttribute && el.getAttribute('onclick');
      if(oc){
        var m = oc.match(/https?:\/\/buy\\.stripe\\.com[^'"]+/);
        if(m) href = m[0];
      }
    }
    go(href);
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key!=='Enter' && e.key!==' ') return;
    var el=document.activeElement;
    if(!el) return;
    var a=el.closest && (el.closest('a[href^="'+STRIPE+'"]') || el.closest('[data-stripe],[data-href^="'+STRIPE+'"],[onclick*="buy.stripe.com"]'));
    if(!a) return;
    e.preventDefault(); e.stopPropagation();
    var href=a.getAttribute('href')||a.getAttribute('data-href')||a.getAttribute('data-stripe');
    if(!href){
      var oc=a.getAttribute('onclick'); 
      if(oc){ var m=oc.match(/https?:\/\/buy\\.stripe\\.com[^'"]+/); if(m) href=m[0]; }
    }
    go(href);
  }, true);
})();`;

    const headers = new Headers(res.headers); headers.delete("content-length");
    const head = `<meta name="c2c-fixpack" content="on"><style>${css}</style>`;
    const body = `<script>${js}</script>`;

    return new HTMLRewriter()
      .on("head", { element(el){ el.append(head, { html:true }); }})
      .on("body", { element(el){ el.append(body, { html:true }); }})
      .transform(new Response(res.body, { status: res.status, headers }));
  }
};
