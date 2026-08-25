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
