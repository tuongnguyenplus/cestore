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
    const viewMain = modal.querySelector('[data-ces-view="main"]');
    const viewProfile = modal.querySelector('[data-ces-view="profile"]');
    const backBtn = modal.querySelector('[data-ces-back]');
    let lastFocus = null;

    const showMain = () => {
      if (viewMain) viewMain.hidden = false;
      if (viewProfile) {
        viewProfile.hidden = true;
        viewProfile.querySelectorAll('.ces-clinreviews__profile').forEach((p) => (p.hidden = true));
      }
      if (backBtn) backBtn.hidden = true;
      if (body) body.scrollTop = 0;
    };

    const showProfile = (targetId) => {
      if (!viewProfile) return;
      viewProfile.querySelectorAll('.ces-clinreviews__profile').forEach((p) => (p.hidden = true));
      const el = targetId
        ? modal.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(targetId) : targetId))
        : null;
      if (!el) return;
      if (viewMain) viewMain.hidden = true;
      viewProfile.hidden = false;
      el.hidden = false;
      if (backBtn) backBtn.hidden = false;
      if (body) body.scrollTop = 0;
    };

    const open = (targetId) => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('overflow-hidden');
      if (targetId) {
        showProfile(targetId);
      } else {
        showMain();
      }
      const focusEl = modal.querySelector('[data-ces-modal-close]');
      if (focusEl) focusEl.focus();
    };
    const close = () => {
      modal.hidden = true;
      document.body.classList.remove('overflow-hidden');
      showMain();
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
    if (backBtn) backBtn.addEventListener('click', showMain);
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
