/*
 * ces-clinician-reviews
 *  - "Show more" reveals only when a review is actually clamped.
 *  - "Learn more" and a clinician name open an info modal (FAQ accordion +
 *    all clinician profiles). A name scrolls the modal to that clinician.
 */
(function () {
  function initShowMore(root) {
    root.querySelectorAll('.ces-clinreviews__message[data-ces-clamp]').forEach((msg) => {
      const btn = msg.parentElement.querySelector('[data-ces-showmore]');
      if (!btn) return;
      if (msg.scrollHeight - msg.clientHeight <= 2) {
        btn.hidden = true;
        return;
      }
      btn.hidden = false;
      const more = btn.textContent.trim() || 'Show more';
      const less = btn.dataset.lessLabel || 'Show less';
      btn.addEventListener('click', () => {
        btn.textContent = msg.classList.toggle('is-open') ? less : more;
      });
    });
  }

  function initModal(root) {
    const modal = root.querySelector('[data-ces-modal]');
    if (!modal) return;
    const body = modal.querySelector('.ces-clinreviews__dialog-body');
    let lastFocus = null;

    const open = (targetId) => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('overflow-hidden');
      const closeBtn = modal.querySelector('[data-ces-modal-close]');
      if (closeBtn) closeBtn.focus();
      // reset scroll, then jump to a clinician if requested
      if (body) body.scrollTop = 0;
      if (targetId) {
        const el = modal.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(targetId) : targetId));
        if (el) {
          el.hidden = false;
          if (body) {
            requestAnimationFrame(() => {
              body.scrollTop = el.offsetTop - body.offsetTop - 8;
              el.classList.add('is-highlight');
              setTimeout(() => el.classList.remove('is-highlight'), 1600);
            });
          }
        }
      }
    };
    const close = () => {
      modal.hidden = true;
      document.body.classList.remove('overflow-hidden');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    // Expose so other sections (e.g. the product-info "Clinicians' Choice"
    // badge) can open this modal.
    modal._cesOpen = open;

    root.querySelectorAll('[data-ces-clin-modal]').forEach((b) =>
      b.addEventListener('click', () => open())
    );
    root.querySelectorAll('[data-ces-clin-open]').forEach((b) =>
      b.addEventListener('click', () => open(b.dataset.target))
    );
    modal.querySelectorAll('[data-ces-modal-close]').forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  function init(root) {
    (root ? [root] : document.querySelectorAll('clinician-reviews, .ces-clinreviews')).forEach((el) => {
      initShowMore(el);
      initModal(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', (e) => init(e.target));

  // Let other sections open the (first) reviews modal on the page.
  document.addEventListener('ces:open-clinreviews', (e) => {
    const modal = document.querySelector('.ces-clinreviews__modal');
    if (modal && typeof modal._cesOpen === 'function') {
      modal._cesOpen(e && e.detail && e.detail.target);
    }
  });
})();
