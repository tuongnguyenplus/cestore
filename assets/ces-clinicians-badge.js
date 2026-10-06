/*
 * ces-clinicians-badge
 * The "Above gallery" Clinicians' Choice card (FrontrowMD-style ribbon):
 *   - The card opens expanded on every page load. The (x) button MINIMIZES it
 *     to a small ribbon card (just the mark); clicking that small card
 *     maximizes it again.
 *   - The minimized state is deliberately NOT remembered. It used to be kept
 *     in localStorage, which meant one click of the (x) left the card minimized
 *     for that shopper for good — every later visit opened on the small ribbon
 *     and the badge read as hidden by default.
 *   - The whole card shows only while the FIRST gallery image is active
 *     (Dawn keeps `is-active` on the shown `.product__media-item`).
 */
(function () {
  function initCard(card) {
    var expanded = card.querySelector('.ces-clinicians__expanded');
    var min = card.querySelector('.ces-clinicians__min');
    var closeBtn = card.querySelector('[data-ces-clin-min]');

    function setMinimized(state) {
      if (expanded) expanded.hidden = state;
      if (min) min.hidden = !state;
      if (closeBtn) closeBtn.hidden = state;
      card.classList.toggle('is-min', state);
    }

    if (min) {
      setMinimized(false);
      if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          setMinimized(true);
        });
      }
      min.addEventListener('click', function () {
        setMinimized(false);
      });
    }

    // First-gallery-image-only visibility.
    var anchor = card.closest('.ces-clin-anchor') || card.parentElement;
    var items = anchor ? anchor.querySelectorAll('.product__media-item') : [];
    var first = items[0];
    if (items.length >= 2 && first) {
      var syncSlide = function () {
        card.classList.toggle('is-hidden', !first.classList.contains('is-active'));
      };
      syncSlide();
      var obs = new MutationObserver(syncSlide);
      items.forEach(function (it) {
        obs.observe(it, { attributes: true, attributeFilter: ['class'] });
      });
    }
  }

  function init(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-ces-clin-card]').forEach(initCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', function (e) {
    init(e.target);
  });
})();
