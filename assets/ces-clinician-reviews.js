/*
 * ces-clinician-reviews
 * Reveals the "Show more" button only when a review message is actually
 * clamped, and toggles the clamp on click (Show more / Show less).
 */
(function () {
  function init(root) {
    (root || document).querySelectorAll('.ces-clinreviews__message[data-ces-clamp]').forEach((msg) => {
      const btn = msg.parentElement.querySelector('[data-ces-showmore]');
      if (!btn) return;

      const overflowing = msg.scrollHeight - msg.clientHeight > 2;
      if (!overflowing) {
        btn.hidden = true;
        return;
      }
      btn.hidden = false;

      const moreLabel = btn.textContent.trim() || 'Show more';
      const lessLabel = btn.dataset.lessLabel || 'Show less';

      btn.addEventListener('click', () => {
        const open = msg.classList.toggle('is-open');
        btn.textContent = open ? lessLabel : moreLabel;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  // Re-init in the theme editor when a section is reloaded.
  document.addEventListener('shopify:section:load', (e) => init(e.target));
})();
