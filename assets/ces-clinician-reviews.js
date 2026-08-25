/*
 * ces-clinician-reviews
 *  - "Show more" reveals only when a review is actually clamped.
 *  - Clicking a clinician name (or "Learn more") opens an info modal with
 *    the FAQ accordion; a clinician name also fills in that clinician's
 *    profile at the top of the modal.
 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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
    const profile = modal.querySelector('[data-ces-profile]');
    let lastFocus = null;

    const open = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('overflow-hidden');
      const closeBtn = modal.querySelector('[data-ces-modal-close]');
      if (closeBtn) closeBtn.focus();
    };
    const close = () => {
      modal.hidden = true;
      document.body.classList.remove('overflow-hidden');
      if (profile) {
        profile.hidden = true;
        profile.innerHTML = '';
      }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    root.querySelectorAll('[data-ces-clin-modal]').forEach((b) =>
      b.addEventListener('click', () => {
        if (profile) {
          profile.hidden = true;
          profile.innerHTML = '';
        }
        open();
      })
    );

    root.querySelectorAll('[data-ces-clin-open]').forEach((b) =>
      b.addEventListener('click', () => {
        if (profile) {
          const d = b.dataset;
          const rows = [];
          if (d.specialty) rows.push(`<div class="ces-clinreviews__dd">Specialty</div><div class="ces-clinreviews__dt">${esc(d.specialty)}</div>`);
          if (d.specialty && d.years) rows.push('<hr class="ces-clinreviews__rule">');
          if (d.years) rows.push(`<div class="ces-clinreviews__dd">Years in practice</div><div class="ces-clinreviews__dt">${esc(d.years)}</div>`);
          const verified = d.verified === 'true'
            ? `<span class="ces-clinreviews__verified">${esc(d.verifiedLabel || 'Verified clinician')} <span class="ces-clinreviews__verified-icon"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="M6 10.3l2.6 2.6L14 7.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>`
            : '';
          const avatar = d.image
            ? `<img class="ces-clinreviews__avatar" src="${esc(d.image)}" alt="${esc(d.name)}">`
            : '<span class="ces-clinreviews__avatar ces-clinreviews__avatar--placeholder"></span>';
          profile.innerHTML =
            `<div class="ces-clinreviews__profile-head">${avatar}` +
              `<div class="ces-clinreviews__provider"><p class="ces-clinreviews__name ces-clinreviews__name--plain">${esc(d.name)}</p>${verified}</div></div>` +
            (rows.length ? `<div class="ces-clinreviews__extra">${rows.join('')}</div>` : '') +
            (d.summary ? `<p class="ces-clinreviews__summary">${esc(d.summary)}</p>` : '') +
            (d.message ? `<div class="ces-clinreviews__message">${d.message}</div>` : '');
          profile.hidden = false;
        }
        open();
        if (profile) profile.scrollIntoView({ block: 'nearest' });
      })
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
})();
