(function(){
  var STRIPE_ORIGIN = 'https://buy.stripe.com';

  function resolveStripeHref(el){
    if(!el) return '';
    var href = el.getAttribute && (el.getAttribute('href') || el.getAttribute('data-href') || el.getAttribute('data-stripe'));
    if(!href){
      var onclick = el.getAttribute && el.getAttribute('onclick');
      if(onclick){
        var match = onclick.match(/https?:\/\/buy\.stripe\.com[^'"\s]+/);
        if(match) href = match[0];
      }
    }
    return href || '';
  }

  function navigate(href){
    if(href && href.indexOf(STRIPE_ORIGIN) === 0){
      window.location.assign(href);
    }
  }

  document.addEventListener('click', function(event){
    var target = event.target.closest && event.target.closest('a[href^="'+STRIPE_ORIGIN+'"],[data-stripe],[data-href^="'+STRIPE_ORIGIN+'"],[onclick*="buy.stripe.com"]');
    if(!target) return;
    var href = resolveStripeHref(target);
    if(!href) return;
    event.preventDefault();
    event.stopPropagation();
    navigate(href);
  }, true);

  document.addEventListener('keydown', function(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    var active = document.activeElement;
    if(!active) return;
    var trigger = active.closest && active.closest('a[href^="'+STRIPE_ORIGIN+'"],[data-stripe],[data-href^="'+STRIPE_ORIGIN+'"],[onclick*="buy.stripe.com"]');
    if(!trigger) return;
    var href = resolveStripeHref(trigger);
    if(!href) return;
    event.preventDefault();
    event.stopPropagation();
    navigate(href);
  }, true);
})();
