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

  /*
   * Shopify renders a section of a JSON template with a generated id:
   * the key "mechanism" becomes shopify-section-template--1234567__mechanism.
   * Links are written with the short form, so the short form has to find it.
   * (The sticky bar carries its own copy of this: one small function repeated
   * beats three files loading a fourth to share it.)
   */
  function cesSectionById(value) {
    if (!value) return null;

    var raw = String(value).replace(/^#/, '');
    var key = raw.replace(/^shopify-section-/, '');
    if (!key) return null;

    var el = document.getElementById(raw) || document.getElementById('shopify-section-' + key);
    if (el) return el;

    try {
      return document.querySelector('[id^="shopify-section-"][id$="__' + CSS.escape(key) + '"]');
    } catch (e) {
      return null;
    }
  }

  function headerOffset() {
    var header = document.querySelector('.section-header, .header-wrapper, sticky-header');
    var h = header ? header.getBoundingClientRect().height : 0;

    // A sticky in-page nav sits below the header and covers the same amount
    // again, so the target has to clear both or it lands underneath the strip.
    // Pages without one measure 0 here and behave exactly as before.
    var nav = document.querySelector('.ces-nav--sticky');
    if (nav) h += nav.getBoundingClientRect().height;

    // A little breathing room so the target does not hug the header edge.
    return h + 16;
  }

  function resolve(hash) {
    // The link's own target first, by id, so a link that names a section lands
    // on that section rather than falling through to the buy box like every
    // other button on the page.
    var named = cesSectionById(hash);
    if (named) return named;

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
