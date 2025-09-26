(function(){
  function initNav(){
    var toggle = document.querySelector('[data-nav-toggle]') || document.getElementById('nav-hamburger') || document.querySelector('.nav-hamburger');
    var menu = document.querySelector('[data-nav-menu]') || document.getElementById('main-nav') || document.querySelector('.nav-menu, nav');
    if(!toggle || !menu) return;

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
      if(menu.contains(e.target) || toggle.contains(e.target)) return;
      close();
    });

    document.addEventListener('focusin', function(e){
      if(!isOpen) return;
      if(menu.contains(e.target) || toggle.contains(e.target)) return;
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

  function extractUrl(el){
    if(!el) return '';
    var href = el.getAttribute('href') || el.getAttribute('data-href') || el.getAttribute('data-stripe');
    if(href) return href;
    var handler = el.getAttribute('onclick');
    if(handler){
      var match = handler.match(/https?:\/\/buy\.stripe\.com[^'"\s]+/);
      if(match) return match[0];
    }
    return '';
  }

  function handleStripe(event, el){
    if(!el) return;
    var url = extractUrl(el);
    if(!url) return;
    event.preventDefault();
    event.stopPropagation();
    window.location.assign(url);
  }

  document.addEventListener('click', function(event){
    var el = event.target.closest && event.target.closest('a[href^="'+STRIPE+'"], [data-stripe], [data-href^="'+STRIPE+'"], [onclick*="buy.stripe.com"]');
    handleStripe(event, el);
  }, true);

  document.addEventListener('keydown', function(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    var el = document.activeElement;
    if(!el) return;
    el = el.closest && el.closest('a[href^="'+STRIPE+'"], [data-stripe], [data-href^="'+STRIPE+'"], [onclick*="buy.stripe.com"]');
    handleStripe(event, el);
  }, true);
})();
