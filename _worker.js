export default {
  async fetch(request, env, ctx) {
    const res = await env.ASSETS.fetch(request);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;

    const url = new URL(request.url);
    const pathname = url.pathname;
    if (pathname.startsWith('/resources') || pathname.startsWith('/site/resources')) return res;
    const css = `:root{--c2c-orange:#FF7A00}
a[href^="https://buy.stripe.com"]{position:relative;z-index:9999;pointer-events:auto !important;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.backdrop,.overlay,.modal-backdrop,.menu-backdrop,.click-shield{pointer-events:none !important}
[data-nav-root]{position:sticky;top:0;background:rgba(0,0,0,0.9);border-bottom:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(8px);z-index:60}
[data-nav-root] .nav-row{display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative}
.nav-hamburger{display:none;flex-direction:column;justify-content:center;align-items:center;width:44px;height:44px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;cursor:pointer;margin-left:8px;position:relative;z-index:101}
.nav-hamburger-bar{width:26px;height:3px;background:#fff;border-radius:2px;margin:3px 0;transition:transform .2s ease,opacity .2s ease}
[data-nav-menu],[data-nav-root] #main-nav{display:flex;align-items:center;gap:16px;margin-left:auto;flex-wrap:wrap}
@media (max-width:768px){
  .nav-hamburger{display:inline-flex}
  [data-nav-menu],[data-nav-root] #main-nav{position:absolute;top:100%;right:0;left:0;background:rgba(0,0,0,0.98);flex-direction:column;align-items:stretch;gap:0;padding:8px 0 12px;box-shadow:0 20px 40px rgba(0,0,0,0.35);border-top:1px solid transparent;transform:translateY(-12px);opacity:0;visibility:hidden;pointer-events:none}
  [data-nav-menu].open,[data-nav-root] #main-nav.open{transform:translateY(0);opacity:1;visibility:visible;pointer-events:auto;border-top-color:rgba(255,255,255,0.12)}
  [data-nav-menu] a,[data-nav-menu] .btn,[data-nav-menu] #c2c-chat-cta,[data-nav-root] #main-nav a,[data-nav-root] #main-nav .btn,[data-nav-root] #main-nav #c2c-chat-cta{width:100%;text-align:left;padding:14px 24px;border-radius:0;margin:0;background:transparent;box-shadow:none}
  [data-nav-menu] .btn,[data-nav-menu] #c2c-chat-cta,[data-nav-root] #main-nav .btn,[data-nav-root] #main-nav #c2c-chat-cta{margin-top:6px}
}
@media (prefers-reduced-motion:reduce){
  .nav-hamburger,.nav-hamburger-bar,[data-nav-menu],[data-nav-root] #main-nav{transition:none !important}
}`;

    const js = `(function(){
  function initNav(){
    var toggle = document.querySelector('[data-nav-toggle]') || document.getElementById('nav-hamburger') || document.querySelector('.nav-hamburger');
    var menu = document.querySelector('[data-nav-menu]') || document.getElementById('main-nav') || document.querySelector('.nav-menu, nav');
    if(!toggle || !menu) return;

    var root = toggle.closest('[data-nav-root]') || toggle.closest('header') || document.body;
    var labelOpen = toggle.getAttribute('aria-label') || toggle.getAttribute('data-nav-label-open') || 'Open navigation';
    var labelClose = toggle.getAttribute('data-nav-label-close') || 'Close navigation';
    if(!menu.id) menu.id = 'c2c-nav';
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', labelOpen);

    var isOpen = false;
    function set(state){
      if(isOpen === state) return;
      isOpen = state;
      menu.classList.toggle('open', state);
      toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
      toggle.setAttribute('aria-label', state ? labelClose : labelOpen);
    }

    function close(){ set(false); }

    toggle.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      set(!isOpen);
    });

    toggle.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        set(!isOpen);
      }
    });

    menu.addEventListener('click', function(e){
      var target = e.target && e.target.closest('a, button');
      if(!target) return;
      if(target.hasAttribute('data-nav-stay-open')) return;
      close();
    });

    document.addEventListener('pointerdown', function(e){
      if(!isOpen) return;
      if(root.contains(e.target)) return;
      close();
    });

    document.addEventListener('focusin', function(e){
      if(!isOpen) return;
      if(root.contains(e.target)) return;
      close();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') close();
    });

    var mq = window.matchMedia('(min-width: 769px)');
    if(mq.addEventListener){
      mq.addEventListener('change', function(ev){ if(ev.matches) close(); });
    } else if(mq.addListener){
      mq.addListener(function(ev){ if(ev.matches) close(); });
    }

    window.addEventListener('resize', function(){
      if(window.innerWidth > 768) close();
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initNav, { once: true });
  } else {
    initNav();
  }

  var STRIPE = 'https://buy.stripe.com';
  function go(href){ if(href) location.assign(href); }

  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('a[href^="'+STRIPE+'"]');
    if(!el) el = e.target.closest('[data-stripe],[data-href^="'+STRIPE+'"],[onclick*="buy.stripe.com"]');
    if(!el) return;
    e.preventDefault(); e.stopPropagation();
    var href = el.getAttribute && (el.getAttribute('href') || el.getAttribute('data-href') || el.getAttribute('data-stripe'));
    if(!href){
      var oc = el.getAttribute && el.getAttribute('onclick');
      if(oc){
        var m = oc.match(/https?:\\/\\/buy\\.stripe\\.com[^'"\s]+/);
        if(m) href = m[0];
      }
    }
    go(href);
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    var el = document.activeElement;
    if(!el) return;
    var target = el.closest && (el.closest('a[href^="'+STRIPE+'"]') || el.closest('[data-stripe],[data-href^="'+STRIPE+'"],[onclick*="buy.stripe.com"]'));
    if(!target) return;
    e.preventDefault(); e.stopPropagation();
    var href = target.getAttribute('href') || target.getAttribute('data-href') || target.getAttribute('data-stripe');
    if(!href){
      var oc = target.getAttribute('onclick');
      if(oc){
        var m = oc.match(/https?:\\/\\/buy\\.stripe\\.com[^'"\s]+/);
        if(m) href = m[0];
      }
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
