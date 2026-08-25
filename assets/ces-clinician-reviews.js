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
    const faq = modal.querySelector('[data-ces-faq]');
    const viewMain = modal.querySelector('[data-ces-view="main"]');
    const viewReviews = modal.querySelector('[data-ces-view="reviews"]');
    const viewProfile = modal.querySelector('[data-ces-view="profile"]');
    const backBtn = modal.querySelector('[data-ces-back]');
    let lastFocus = null;
    let lastList = 'main';

    const hideAll = () => {
      [viewMain, viewReviews, viewProfile].forEach((v) => {
        if (v) v.hidden = true;
      });
      if (viewProfile) {
        viewProfile.querySelectorAll('.ces-clinreviews__profile').forEach((p) => (p.hidden = true));
      }
    };

    // which: 'main' | 'reviews'
    const showList = (which) => {
      hideAll();
      lastList = which === 'reviews' ? 'reviews' : 'main';
      if (faq) faq.hidden = false;
      const v = lastList === 'reviews' ? viewReviews : viewMain;
      if (v) v.hidden = false;
      if (backBtn) backBtn.hidden = true;
      if (body) body.scrollTop = 0;
    };

    const showProfile = (targetId) => {
      if (!viewProfile) return;
      const el = targetId
        ? modal.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(targetId) : targetId))
        : null;
      if (!el) {
        showList(lastList);
        return;
      }
      hideAll();
      if (faq) faq.hidden = true;
      viewProfile.hidden = false;
      el.hidden = false;
      if (backBtn) backBtn.hidden = false;
      if (body) body.scrollTop = 0;
    };

    // opts: {view:'main'|'reviews'} or {target:'ClinProf-..'} or a target string
    const open = (opts) => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('overflow-hidden');
      if (typeof opts === 'string') {
        showProfile(opts);
      } else if (opts && opts.target) {
        showProfile(opts.target);
      } else if (opts && opts.view === 'reviews') {
        showList('reviews');
      } else {
        showList('main');
      }
      const focusEl = modal.querySelector('[data-ces-modal-close]');
      if (focusEl) focusEl.focus();
    };
    const close = () => {
      modal.hidden = true;
      document.body.classList.remove('overflow-hidden');
      showList('main');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    // Expose so other sections (e.g. the product-info "Clinicians' Choice"
    // badge) can open this modal.
    modal._cesOpen = open;

    root.querySelectorAll('[data-ces-clin-modal]').forEach((b) =>
      b.addEventListener('click', () => open({ view: 'main' }))
    );
    root.querySelectorAll('[data-ces-clin-reviews]').forEach((b) =>
      b.addEventListener('click', () => open({ view: 'reviews' }))
    );
    root.querySelectorAll('[data-ces-clin-open]').forEach((b) =>
      b.addEventListener('click', () => open({ target: b.dataset.target }))
    );
    if (backBtn) backBtn.addEventListener('click', () => showList(lastList));
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
      modal._cesOpen((e && e.detail) || { view: 'main' });
    }
  });
})();
