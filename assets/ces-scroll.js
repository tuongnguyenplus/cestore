/*
 * ces-scroll.js
 *
 * Smooth in-page scrolling for the call-to-action buttons. A plain
 * <a href="#ces-app-price-slot"> works only while that element exists, but a
 * pricing app can replace or remove the slot it mounts into, and on some mobile
 * browsers the jump to a zero-height empty target does nothing at all. This
 * intercepts those clicks, resolves the best available target, and scrolls to
 * it with the sticky header allowed for.
 */
(function () {
  if (window.cesScrollBound) return;
  window.cesScrollBound = true;

  // Tried in order: the button's own target first, then the buy box, then the
  // product section — so the button always lands somewhere sensible.
  var FALLBACKS = [
    '#ces-app-price-slot',
    '[data-ces-app-slot]',
    '.ces-app-price-slot',
    '.product-form__buttons',
    'product-form',
    '.product-form',
    '[id^="MainProduct-"]',
    '[id^="ProductInfo-"]',
  ];

  function headerOffset() {
    var header = document.querySelector('.section-header, .header-wrapper, sticky-header');
    var h = header ? header.getBoundingClientRect().height : 0;
    // A little breathing room so the target does not hug the header edge.
    return h + 16;
  }

  function resolve(hash) {
    var selectors = [];
    if (hash && hash.length > 1) selectors.push(hash);
    selectors = selectors.concat(FALLBACKS);

    for (var i = 0; i < selectors.length; i++) {
      var el;
      try {
        el = document.querySelector(selectors[i]);
      } catch (e) {
        el = null;
      }
      // The app slot can be present but empty; still a valid scroll target.
      if (el) return el;
    }
    return null;
  }

  function scrollTo(el) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href*="#"]');
    if (!link) return;

    // Only handle same-page anchors.
    var href = link.getAttribute('href') || '';
    var hashIndex = href.indexOf('#');
    if (hashIndex === -1) return;
    var hash = href.slice(hashIndex);
    if (hash === '#') return;

    // Leave links that point at a real, different page alone.
    var path = href.slice(0, hashIndex);
    if (path && path.indexOf('://') !== -1) return;
    if (path && path !== window.location.pathname) return;

    // Only take over for the CES call-to-action buttons and the sticky bar, so
    // ordinary anchor links elsewhere keep their native behaviour.
    if (!link.closest('.ces-section, ces-sticky-atc, .ces-sticky-atc')) return;

    var target = resolve(hash);
    if (!target) return;

    event.preventDefault();
    scrollTo(target);
  });
})();
