(function(){
  var ROOT_ATTR = 'data-nav-root';
  var TOGGLE_ATTR = 'data-nav-toggle';
  var MENU_ATTR = 'data-nav-menu';
  var OPEN_CLASS = 'open';
  var BREAKPOINT = 768;
  var media = window.matchMedia('(min-width: ' + (BREAKPOINT + 1) + 'px)');

  function ready(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function initNav(root){
    var toggle = root.querySelector('[' + TOGGLE_ATTR + ']');
    var menu = root.querySelector('[' + MENU_ATTR + ']');
    if(!toggle || !menu) return;

    var labelOpen = toggle.getAttribute('aria-label') || toggle.getAttribute('data-nav-label-open') || 'Open navigation';
    var labelClose = toggle.getAttribute('data-nav-label-close') || 'Close navigation';
    var isOpen = false;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', labelOpen);

    function setOpen(next){
      if(isOpen === next) return;
      isOpen = next;
      menu.classList.toggle(OPEN_CLASS, next);
      toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
      toggle.setAttribute('aria-label', next ? labelClose : labelOpen);
    }

    function onToggle(event){
      event.preventDefault();
      event.stopPropagation();
      setOpen(!isOpen);
    }

    function onOutside(event){
      if(!isOpen) return;
      if(root.contains(event.target)) return;
      setOpen(false);
    }

    function onKey(event){
      if(event.key === 'Escape' && isOpen){
        setOpen(false);
      }
    }

    function onNavActivate(event){
      var interactive = event.target.closest('a, button');
      if(!interactive) return;
      if(!menu.contains(interactive)) return;
      if(interactive.hasAttribute('data-nav-stay-open')) return;
      setOpen(false);
    }

    function onResize(){
      if(window.innerWidth > BREAKPOINT){
        setOpen(false);
      }
    }

    toggle.addEventListener('click', onToggle);
    toggle.addEventListener('keydown', function(event){
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        onToggle(event);
      }
    });

    menu.addEventListener('click', onNavActivate);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', function(event){
      if(!isOpen) return;
      if(root.contains(event.target)) return;
      setOpen(false);
    });
    document.addEventListener('keydown', onKey);

    media.addEventListener('change', function(e){
      if(e.matches){
        setOpen(false);
      }
    });
    window.addEventListener('resize', onResize);
  }

  ready(function(){
    document.querySelectorAll('[' + ROOT_ATTR + ']').forEach(initNav);
  });
})();
