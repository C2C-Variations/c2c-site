(function () {
  const NAV_SELECTOR = '[data-nav-menu]';
  const NAV_LINK_TEXT = 'Resources';
  const NAV_HREF = '/resources.html';

  function hasLink(container) {
    return Array.from(container.querySelectorAll('a')).some(link => link.textContent.trim() === NAV_LINK_TEXT);
  }

  function createLink() {
    const anchor = document.createElement('a');
    anchor.href = NAV_HREF;
    anchor.textContent = NAV_LINK_TEXT;
    return anchor;
  }

  function applyToNav(container) {
    if (!container || hasLink(container)) {
      return;
    }
    const whatsappBtn = container.querySelector('.btn.btn-wa');
    if (whatsappBtn && whatsappBtn.parentElement === container) {
      container.insertBefore(createLink(), whatsappBtn);
    } else {
      container.appendChild(createLink());
    }
  }

  function init() {
    const navContainers = document.querySelectorAll(NAV_SELECTOR);
    navContainers.forEach(applyToNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

