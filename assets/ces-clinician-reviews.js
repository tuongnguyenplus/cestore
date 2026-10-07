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
      const profiles = modal.querySelector('[data-ces-view="profile"]');
      const note = modal.querySelector('[data-ces-roster-empty]');
      if (!data || !list) return;
      let lines;
      try {
        lines = String(JSON.parse(data.textContent) || '').split('\n');
      } catch (err) {
        if (note) note.hidden = false;
        return;
      }
      // The labels come from the section so there is one copy of each, rather
      // than a second English set living in here.
      const L = data.dataset;
      const rows = document.createDocumentFragment();
      const panels = document.createDocumentFragment();

      const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
      };
      // Only http(s) is followed: a line comes from a theme setting, and
      // javascript: in that slot would otherwise become a live link.
      const safeHref = (h) => (h && /^https?:\/\//i.test(h) ? h : '');
      // The same arrow the blocks' rows and links carry. It is a constant in
      // here, never anything off a roster line, so insertAdjacentHTML is only
      // ever handed this string.
      const ARROW =
        '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M6 3h7v7M13 3 6.5 9.5M11 9v4H3V5h4" stroke="currentColor" stroke-width="1.4" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';

      lines.forEach((raw, i) => {
        const line = raw.trim();
        if (!line) return;
        const f = line.split('|').map((x) => x.trim());
        const name = f[0];
        if (!name) return;
        const [, place, site, expertise, npi, practice, joined, years] = f;
        const href = safeHref(site);

        // Anything beyond the name is worth a panel of its own.
        const details = [
          [L.labelWebsite, href, true],
          [L.labelExpertise, expertise],
          [L.labelLocation, place],
          [L.labelNpi, npi],
          [L.labelPractice, practice],
          [L.labelJoined, joined],
          [L.labelYears, years],
        ].filter((d) => d[1]);
        // Keyed off the section element, which carries ClinReviews-<section id>,
        // so two of these sections on one page cannot collide.
        const id = (root.id || 'ClinReviews') + '-roster-' + i;

        const li = el('li', 'ces-clinreviews__shared-item ces-clinreviews__shared-item--plain');
        const avatar = el('span', 'ces-clinreviews__shared-avatar ces-clinreviews__avatar--placeholder');
        avatar.setAttribute('aria-hidden', 'true');
        const info = el('span', 'ces-clinreviews__shared-info');

        let nameEl;
        if (details.length) {
          nameEl = el('button', 'ces-clinreviews__shared-name', name);
          nameEl.type = 'button';
          nameEl.addEventListener('click', () => open({ target: id }));
        } else if (href) {
          nameEl = el('a', 'ces-clinreviews__shared-name', name);
          nameEl.href = href;
          nameEl.target = '_blank';
          nameEl.rel = 'noopener nofollow';
        } else {
          nameEl = el('span', 'ces-clinreviews__shared-name', name);
        }
        info.appendChild(nameEl);
        if (place) info.appendChild(el('span', 'ces-clinreviews__shared-loc', place));

        li.appendChild(avatar);
        li.appendChild(info);

        if (details.length) {
          const prev = el('button', 'ces-clinreviews__preview', L.labelPreview || 'Preview');
          prev.type = 'button';
          prev.insertAdjacentHTML('beforeend', ARROW);
          prev.addEventListener('click', () => open({ target: id }));
          li.appendChild(prev);

          const panel = el('div', 'ces-clinreviews__profile');
          panel.id = id;
          panel.hidden = true;
          const head = el('div', 'ces-clinreviews__profile-head');
          const pa = el('span', 'ces-clinreviews__profile-avatar ces-clinreviews__avatar--placeholder');
          pa.setAttribute('aria-hidden', 'true');
          head.appendChild(pa);
          head.appendChild(el('p', 'ces-clinreviews__profile-name', name));
          panel.appendChild(head);

          const dl = el('dl', 'ces-clinreviews__info');
          details.forEach(([label, value, isLink]) => {
            const row = el('div', 'ces-clinreviews__info-row');
            row.appendChild(el('dt', null, label));
            const dd = el('dd');
            if (isLink) {
              const a = el('a', 'ces-clinreviews__info-link', L.labelLink || value);
              a.href = value;
              a.target = '_blank';
              a.rel = 'noopener nofollow';
              a.insertAdjacentHTML('beforeend', ARROW);
              dd.appendChild(a);
            } else {
              dd.textContent = value;
            }
            row.appendChild(dd);
            dl.appendChild(row);
          });
          panel.appendChild(dl);
          panels.appendChild(panel);
        }

        rows.appendChild(li);
      });

      list.appendChild(rows);
      if (profiles) profiles.appendChild(panels);
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
