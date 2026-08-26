/*
 * ces-clinicians-badge
 * The "Above gallery" Clinicians' Choice card:
 *   - Shows only while the FIRST gallery image is active (Dawn keeps `is-active`
 *     on the shown `.product__media-item`; mirror it).
 *   - The (x) button dismisses the whole card for the current visit
 *     (sessionStorage), so it comes back on the next visit.
 */
(function () {
  function initCard(card) {
    var key = card.getAttribute('data-storage-key') || 'cesClinBadge';
    var closeBtn = card.querySelector('[data-ces-clin-collapse]');

    var dismissed = false;
    try {
      dismissed = sessionStorage.getItem(key) === '1';
    } catch (e) {}

    // The card belongs to the first gallery image only.
    var anchor = card.closest('.ces-clin-anchor') || card.parentElement;
    var items = anchor ? anchor.querySelectorAll('.product__media-item') : [];
    var first = items[0];
    var multi = items.length >= 2;

    function apply() {
      var onFirst = !multi || (first && first.classList.contains('is-active'));
      // Use a class (not [hidden]) so it beats the card's own display rule.
      card.classList.toggle('is-hidden', dismissed || !onFirst);
    }
    apply();

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        dismissed = true;
        try {
          sessionStorage.setItem(key, '1');
        } catch (e) {}
        apply();
      });
    }

    if (multi && first) {
      var obs = new MutationObserver(apply);
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
