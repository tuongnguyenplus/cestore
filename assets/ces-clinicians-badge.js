/*
 * ces-clinicians-badge
 * The "Above gallery" Clinicians' Choice card has an expanded and a collapsed
 * state. The (x) button collapses it, clicking the collapsed pill expands it,
 * and the choice is remembered per-browser via localStorage.
 */
(function () {
  function initCard(card) {
    var key = card.getAttribute('data-storage-key') || 'cesClinBadge';
    var expanded = card.querySelector('.ces-clinicians__expanded');
    var collapsed = card.querySelector('.ces-clinicians__collapsed');
    var closeBtn = card.querySelector('[data-ces-clin-collapse]');

    // Nothing to toggle to — leave the expanded card as-is.
    if (!collapsed) return;

    function setCollapsed(state) {
      if (expanded) expanded.hidden = state;
      collapsed.hidden = !state;
      card.classList.toggle('is-collapsed', state);
    }

    var saved = false;
    try {
      saved = localStorage.getItem(key) === '1';
    } catch (e) {}
    setCollapsed(saved);

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        setCollapsed(true);
        try {
          localStorage.setItem(key, '1');
        } catch (err) {}
      });
    }

    collapsed.addEventListener('click', function () {
      setCollapsed(false);
      try {
        localStorage.setItem(key, '0');
      } catch (err) {}
    });
  }

  /*
   * The card belongs to the FIRST gallery image only. Dawn keeps the
   * `is-active` class on the currently shown `.product__media-item` (updated on
   * thumbnail click and on mobile swipe), so mirror the card's visibility to
   * whether the first media item is the active one.
   */
  function initSlideVisibility(card) {
    var anchor = card.closest('.ces-clin-anchor') || card.parentElement;
    if (!anchor) return;
    var items = anchor.querySelectorAll('.product__media-item');
    if (items.length < 2) return; // single image: always show
    var first = items[0];

    function sync() {
      card.style.display = first.classList.contains('is-active') ? '' : 'none';
    }
    sync();

    var obs = new MutationObserver(sync);
    items.forEach(function (it) {
      obs.observe(it, { attributes: true, attributeFilter: ['class'] });
    });
  }

  function init(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-ces-clin-card]').forEach(function (card) {
      initCard(card);
      initSlideVisibility(card);
    });
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
