/*
 * <ces-anchor-nav>
 *
 * Two jobs for the in-page nav in sections/ces-anchor-nav.liquid.
 *
 * 1. Marks the link whose section the shopper is currently reading. Scrolling a
 *    long PDP without that is disorienting — the nav looks the same at the top
 *    as it does two thirds of the way down.
 * 2. Keeps the active link scrolled into view inside the strip, which on a
 *    phone is narrower than the set of links.
 *
 * Scrolling itself is left to ces-scroll.js, and the links are plain anchors,
 * so the nav is fully usable before this file loads.
 */
if (!customElements.get('ces-anchor-nav')) {
  /*
   * Shopify renders a section of a JSON template with a generated id:
   * the key "mechanism" becomes shopify-section-template--1234567__mechanism.
   * Links are written with the short form, so the short form has to find it.
   * (The sticky bar carries its own copy of this: one small function repeated
   * beats three files loading a fourth to share it.)
   */
  function cesSectionById(value) {
    if (!value) return null;

    var raw = String(value).replace(/^#/, '');
    var key = raw.replace(/^shopify-section-/, '');
    if (!key) return null;

    var el = document.getElementById(raw) || document.getElementById('shopify-section-' + key);
    if (el) return el;

    try {
      return document.querySelector('[id^="shopify-section-"][id$="__' + CSS.escape(key) + '"]');
    } catch (e) {
      return null;
    }
  }

  class CesAnchorNav extends HTMLElement {
    connectedCallback() {
      if (this.observer) return;

      this.strip = this.querySelector('[data-ces-nav-strip]');
      this.links = Array.from(this.querySelectorAll('a[href^="#"]'));
      if (!this.links.length || typeof IntersectionObserver !== 'function') return;

      // Pair each link with its target once. A link pointing at an id that is
      // not on the page (a disabled section, say) is dropped rather than left
      // as a dead highlight.
      this.pairs = [];
      this.links.forEach((link) => {
        const id = (link.getAttribute('href') || '').slice(1);
        if (!id) return;
        let target = null;
        try {
          target = cesSectionById(id);
        } catch (e) {
          target = null;
        }
        if (target) this.pairs.push({ link: link, target: target });
      });
      if (!this.pairs.length) return;

      this.visible = new Set();

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) this.visible.add(entry.target);
            else this.visible.delete(entry.target);
          });
          this.update();
        },
        // The top band only: a section counts as "current" once its start has
        // reached roughly the upper third of the viewport, which is where a
        // reader's eye actually is.
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      );

      this.pairs.forEach((pair) => this.observer.observe(pair.target));
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
      this.observer = null;
    }

    update() {
      // With several sections in the band, the last one down the page wins —
      // that is the one the reader has just arrived at.
      let current = null;
      this.pairs.forEach((pair) => {
        if (this.visible.has(pair.target)) current = pair;
      });

      this.pairs.forEach((pair) => {
        const on = pair === current;
        pair.link.classList.toggle('is-current', on);
        if (on) pair.link.setAttribute('aria-current', 'true');
        else pair.link.removeAttribute('aria-current');
      });

      if (current) this.reveal(current.link);
    }

    reveal(link) {
      if (!this.strip || this.strip.scrollWidth <= this.strip.clientWidth) return;

      const strip = this.strip.getBoundingClientRect();
      const item = link.getBoundingClientRect();
      if (item.left >= strip.left && item.right <= strip.right) return;

      const delta = item.left + item.width / 2 - (strip.left + strip.width / 2);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.strip.scrollBy({ left: delta, behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  customElements.define('ces-anchor-nav', CesAnchorNav);
}
