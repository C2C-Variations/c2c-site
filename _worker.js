export default {
  async fetch(request, env, ctx) {
    // Serve your existing static site first
    const res = await env.ASSETS.fetch(request);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;

    // --- Fix Pack (inline) ---
    const css = `:root{--c2c-orange:#FF7A00}
a[href^="https://buy.stripe.com"]{position:relative;z-index:9999;pointer-events:auto !important;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.backdrop,.overlay,.modal-backdrop,.menu-backdrop,.click-shield{pointer-events:none !important}
.nav-menu{display:none}.nav-menu.open{display:block}
header[role="banner"].is-fixed+main{padding-top:72px}`;

    const js = `(function(){
  // Verification marker
  try{ window.__C2C_FIXPACK = true; }catch(e){}
  // 1) Hamburger toggle (support multiple patterns)
  function bindMenu(btn, menu){
    if(!btn || !menu) return;
    if(!menu.id) menu.id = 'c2c-nav';
    btn.setAttribute('aria-controls', menu.id);
    btn.addEventListener('click', function(e){
      e.preventDefault();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }, {passive:false});
  }
  const buttons = Array.from(document.querySelectorAll('[data-nav-toggle], .hamburger, .menu-toggle, #menu-toggle, button[aria-label="Menu"]'));
  const menus   = Array.from(document.querySelectorAll('[data-nav], nav .nav-menu, #nav, #mobile-menu, .nav-menu'));
  if(buttons.length && menus.length){ bindMenu(buttons[0], menus[0]); }

  // 2) Force navigation for Stripe Payment Links
  function go(h){ if(!h) return; location.assign(h); }
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a[href^="https://buy.stripe.com"]');
    if(a){ e.preventDefault(); e.stopPropagation(); go(a.href); }
  }, true); // capture phase

  document.addEventListener('keydown', function(e){
    if(e.key!=='Enter' && e.key!==' ') return;
    const el = document.activeElement;
    const a = el && el.closest && el.closest('a[href^="https://buy.stripe.com"]');
    if(a){ e.preventDefault(); e.stopPropagation(); go(a.href); }
  }, true);
})();`;

    // Inject meta for easy verification
    const headInject = `<meta name="c2c-fixpack" content="on"><style>${css}</style>`;
    const bodyInject = `<script>${js}</script>`;

    const headers = new Headers(res.headers);
    headers.delete("content-length");

    const rewriter = new HTMLRewriter()
      .on("head", { element(el){ el.append(headInject, { html: true }); } })
      .on("body", { element(el){ el.append(bodyInject, { html: true }); } });

    return rewriter.transform(new Response(res.body, { status: res.status, headers }));
  }
};