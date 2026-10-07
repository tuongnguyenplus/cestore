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

    /*
     * The roster — every clinician beyond the few with a full profile — is
     * handed over as JSON and turned into rows the first time the modal is
     * opened. Written into the page instead, a couple of hundred names would
     * be a few hundred elements that every shopper downloads and parses
     * whether or not they ever open this.
     */
    let rosterDone = false;
    const buildRoster = () => {
      if (rosterDone) return;
      rosterDone = true;
      const data = modal.querySelector('[data-ces-roster]');
      const list = modal.querySelector('.ces-clinreviews__shared-list');
      const note = modal.querySelector('[data-ces-roster-empty]');
      if (!data || !list) return;
      let lines;
      try {
        lines = String(JSON.parse(data.textContent) || '').split('\n');
      } catch (err) {
        if (note) note.hidden = false;
        return;
      }
      const frag = document.createDocumentFragment();
      lines.forEach((raw) => {
        const line = raw.trim();
        if (!line) return;
        // "Name | Location | Link", of which only the name is required.
        const [name, place, href] = line.split('|').map((x) => x.trim());
        if (!name) return;

        const li = document.createElement('li');
        li.className = 'ces-clinreviews__shared-item ces-clinreviews__shared-item--plain';

        const avatar = document.createElement('span');
        avatar.className = 'ces-clinreviews__shared-avatar ces-clinreviews__avatar--placeholder';
        avatar.setAttribute('aria-hidden', 'true');

        const info = document.createElement('span');
        info.className = 'ces-clinreviews__shared-info';

        // Only http(s) links are followed: a line comes from a theme setting,
        // and javascript: in that slot would otherwise become a live link.
        let nameEl;
        if (href && /^https?:\/\//i.test(href)) {
          nameEl = document.createElement('a');
          nameEl.href = href;
          nameEl.target = '_blank';
          nameEl.rel = 'noopener nofollow';
        } else {
          nameEl = document.createElement('span');
        }
        nameEl.className = 'ces-clinreviews__shared-name';
        nameEl.textContent = name;
        info.appendChild(nameEl);

        if (place) {
          const loc = document.createElement('span');
          loc.className = 'ces-clinreviews__shared-loc';
          loc.textContent = place;
          info.appendChild(loc);
        }

        li.appendChild(avatar);
        li.appendChild(info);
        frag.appendChild(li);
      });
      list.appendChild(frag);
    };

    // opts: {view:'main'|'reviews'} or {target:'ClinProf-..'} or a target string
    const open = (opts) => {
      lastFocus = document.activeElement;
      buildRoster();
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
      return;
    }
    // The clinicians badge can be switched on in the product section while
    // this section is not on the template at all. The click then did nothing
    // whatsoever and raised nothing, which is a slow thing to work out from
    // the outside, so say what is missing.
    console.warn(
      '[ces] A clinicians badge asked to open the reviews modal, but no "CES Clinician reviews" section is on this page. Add one to the template.'
    );
  });
})();
