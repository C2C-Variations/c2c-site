(function () {
  // Mobile nav toggle
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  // Dropdown menus
  document.querySelectorAll('[data-dropdown]').forEach(function (dd) {
    var btn = dd.querySelector('[data-dropdown-toggle]');
    if (btn) {
      btn.addEventListener('click', function () {
        dd.classList.toggle('is-open');
      });
    }
  });

  // Highlight current page link
  var here = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('a[rel="nav"]').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace(/\/+$/, '');
    if (href && href === here) a.classList.add('is-active');
  });
})();
