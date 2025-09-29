(()=>{
  if(window.__C2C_SITE_ENHANCEMENTS__) return;
  window.__C2C_SITE_ENHANCEMENTS__ = true;

  console.info('C2C site enhancements BOOT');

  function ready(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function(){
    var root = document.querySelector('[data-nav-root]');
    var toggle = root && (root.querySelector('[data-nav-toggle]') || document.getElementById('c2c-nav-toggle'));
    var menu = root && (root.querySelector('[data-nav-menu]') || root.querySelector('.site-nav'));

    if(toggle && menu){
      var open = false;
      function set(state){
        if(open === state) return;
        open = state;
        menu.classList.toggle('open', state);
        toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
        var labelOpen = toggle.getAttribute('data-label-open') || 'Open navigation';
        var labelClose = toggle.getAttribute('data-label-close') || 'Close navigation';
        toggle.setAttribute('aria-label', state ? labelClose : labelOpen);
        document.body.classList.toggle('nav-open', state);
      }

      toggle.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        set(!open);
      });

      toggle.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter' || ev.key === ' '){
          ev.preventDefault();
          set(!open);
        }
      });

      menu.addEventListener('click', function(ev){
        var target = ev.target && ev.target.closest('a, button');
        if(!target) return;
        if(target.hasAttribute('data-nav-stay-open')) return;
        set(false);
      });

      document.addEventListener('pointerdown', function(ev){
        if(!open) return;
        if(root.contains(ev.target)) return;
        set(false);
      });

      document.addEventListener('keydown', function(ev){
        if(ev.key === 'Escape' && open){
          set(false);
        }
      });

      window.addEventListener('resize', function(){
        if(window.innerWidth > 880){
          set(false);
        }
      });
    }

    var path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
    document.querySelectorAll('a[rel="nav"]').forEach(function(link){
      var href = (link.getAttribute('href') || '').replace(/\/index\.html$/, '/');
      if(!href) return;
      if(href === '/' && path === '/'){
        link.classList.add('is-active');
        return;
      }
      if(href.endsWith('/') && path === href){
        link.classList.add('is-active');
        return;
      }
      if(href === location.pathname){
        link.classList.add('is-active');
      }
    });

    document.addEventListener('click', function(event){
      var anchor = event.target && event.target.closest('a[href^="#"]');
      if(!anchor) return;
      var id = anchor.getAttribute('href').slice(1);
      if(!id) return;
      var target = document.getElementById(id);
      if(!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
