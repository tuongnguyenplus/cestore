/*
 * ces-clinicians-badge
 * The "Above gallery" Clinicians' Choice card (FrontrowMD-style ribbon):
 *   - The (x) button MINIMIZES to a small ribbon card (just the mark);
 *     clicking that small card maximizes it again. The state is remembered.
 *   - The whole card shows only while the FIRST gallery image is active
 *     (Dawn keeps `is-active` on the shown `.product__media-item`).
 */
(function () {
  function initCard(card) {
    var key = card.getAttribute('data-storage-key') || 'cesClinBadge';
    var expanded = card.querySelector('.ces-clinicians__expanded');
    var min = card.querySelector('.ces-clinicians__min');
    var closeBtn = card.querySelector('[data-ces-clin-min]');

    var minimized = false;
    try {
      minimized = localStorage.getItem(key) === 'min';
    } catch (e) {}

    function setMinimized(state) {
      minimized = state;
      if (expanded) expanded.hidden = state;
      if (min) min.hidden = !state;
      if (closeBtn) closeBtn.hidden = state;
      card.classList.toggle('is-min', state);
    }

    if (min) {
      setMinimized(minimized);
      if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          setMinimized(true);
          try {
            localStorage.setItem(key, 'min');
          } catch (err) {}
        });
      }
      min.addEventListener('click', function () {
        setMinimized(false);
        try {
          localStorage.setItem(key, 'max');
        } catch (err) {}
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
