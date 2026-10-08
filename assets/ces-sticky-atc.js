/*
 * <ces-sticky-atc>
 *
 * Reveals the bottom bar in sections/ces-sticky-atc.liquid once the real buy
 * box has scrolled out of view, and hides it again when the shopper is looking
 * straight at it — a second call to action on top of the first is just noise.
 *
 * The bar's button is an ordinary anchor, so it already works before this file
 * loads; all this element decides is when the bar is worth showing.
 */
if (!customElements.get('ces-sticky-atc')) {
  class CesStickyAtc extends HTMLElement {
    connectedCallback() {
      if (this.initialised) return;

      // The bar always scrolls back to the buy box (data-target). What makes it
      // appear can be a different element (data-reveal) — e.g. a "Try risk-free"
      // button — so a merchant can choose exactly how far down the bar kicks in.
      this.section = this.resolveSection(this.dataset.target);
      this.target = this.section;

      // The button can be aimed at one block inside that section — the bundle
      // selector rather than the top of the buy box, say. The block is found by
      // a selector the section setting chose, and given an id if it has none,
      // so the page's own scroll script can take the click from there and allow
      // for the sticky header exactly as it does everywhere else.
      const inner = this.dataset.targetInner;
      if (this.section && inner) {
        let block = null;
        try {
          block = this.section.querySelector(inner);
        } catch (e) {
          block = null;
        }
        if (block) {
          if (!block.id) block.id = 'ces-sticky-atc-target';
          this.target = block;
        } else {
          console.warn('[ces] Sticky bar: nothing matching "' + inner + '" inside the scroll target.');
        }
      }

      const revealId = this.dataset.reveal;
      let revealTarget = this.resolveSection(revealId);

      if (revealId && !revealTarget) {
        // An id typed into a theme setting is the one thing here that can be
        // wrong, and the bar used to answer that by doing nothing at all.
        console.warn(
          '[ces] Sticky bar: no element with id "' + revealId + '". Falling back to the first section.'
        );
      }

      // Then the buy box it scrolls to, then the first real section of the
      // page. "Real" matters: the first .shopify-section in the document is
      // often the header, and a sticky header never scrolls out of view, so a
      // bar waiting for it to leave waits for ever.
      if (!this.canReveal(revealTarget)) revealTarget = null;
      if (!revealTarget && this.canReveal(this.section)) revealTarget = this.section;
      if (!revealTarget) {
        const sections = document.querySelectorAll('#MainContent .shopify-section, main .shopify-section');
        for (let i = 0; i < sections.length; i += 1) {
          if (this.canReveal(sections[i])) {
            revealTarget = sections[i];
            break;
          }
        }
      }

      // The button is written as a link to the buy box's id. Now that the id
      // has actually been found, point it at what was found, so the link works
      // on its own even if the page's scroll script never loads.
      if (this.target && this.target.id) {
        const links = this.querySelectorAll('a[href^="#"]');
        for (let i = 0; i < links.length; i += 1) links[i].setAttribute('href', '#' + this.target.id);
      }

      this.initialised = true;
      this.watchEditor();

      // The bar is a reminder of the buy box, so it stands down while the buy
      // box itself is on the screen: two of the same call to action at once,
      // one of them covering the real one, is worse than none.
      this.watchBuyBox();

      if (revealTarget && typeof IntersectionObserver === 'function') {
        this.observer = new IntersectionObserver(
          ([entry]) => {
            // Show once the trigger has been scrolled up out of the viewport,
            // not while it is still below the fold on the way down.
            this.revealed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            this.refresh();
          },
          { threshold: 0 }
        );
        this.observer.observe(revealTarget);
        return;
      }

      // Nothing to watch: show the bar once a screenful has been scrolled.
      // A bar that never appears is worse than one that appears a little early.
      this.onScroll = () => {
        this.revealed = window.scrollY > window.innerHeight * 0.9;
        this.refresh();
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.onScroll();
    }

    /*
     * Watches the buy box — the element the bar's own button scrolls to — and
     * keeps the bar out of the way for as long as any part of it is in view.
     * Without this the bar sits over the thing it is pointing at, hiding the
     * variant picker or the add-to-cart button on a phone.
     */
    watchBuyBox() {
      if (this.dataset.overTarget === 'show') return;
      if (!this.section || this.section === this || this.section.contains(this)) return;
      if (typeof IntersectionObserver !== 'function') return;

      this.buyBoxObserver = new IntersectionObserver(
        ([entry]) => {
          this.overBuyBox = entry.isIntersecting;
          this.refresh();
        },
        { threshold: 0 }
      );
      // The whole section, not the block the button aims at: the bar is in the
      // way of all of it, not just the part it points to.
      this.buyBoxObserver.observe(this.section);
    }

    // One place decides, so the two observers cannot argue about it.
    refresh() {
      this.toggle(this.revealed === true && this.overBuyBox !== true);
    }

    /*
     * Finds a section by the id a merchant typed. Shopify does not give a
     * section in a JSON template the tidy id the template file calls it: the
     * key "hero" is rendered as shopify-section-template--1234567__hero. An id
     * typed as "hero", or as "shopify-section-hero", has to find it anyway, or
     * every setting that names a section is quietly wrong.
     */
    resolveSection(value) {
      if (!value) return null;

      const raw = String(value).replace(/^#/, '');
      const key = raw.replace(/^shopify-section-/, '');
      if (!key) return null;

      const direct = document.getElementById(raw) || document.getElementById('shopify-section-' + key);
      if (direct) return direct;

      try {
        return document.querySelector('[id^="shopify-section-"][id$="__' + CSS.escape(key) + '"]');
      } catch (e) {
        return null;
      }
    }

    /*
     * Whether an element can be used as the trigger. It has to be something
     * that leaves the viewport when the page is scrolled and that has a size
     * to leave it with — a sticky header, a fixed bar or a zero-height wrapper
     * would hold the bar hidden for the whole page.
     */
    canReveal(element) {
      if (!element || element === this || element.contains(this)) return false;

      const position = getComputedStyle(element).position;
      if (position === 'sticky' || position === 'fixed') return false;

      return element.getBoundingClientRect().height > 0;
    }

    /*
     * In the theme editor the bar is pinned and starts hidden, so a merchant
     * who clicks it in the sidebar is shown the page with nothing on it and
     * reasonably concludes it is broken. Shopify announces that click, so the
     * bar answers it: visible while it is the section being edited, back to
     * its scroll rule as soon as something else is.
     */
    watchEditor() {
      if (!window.Shopify || !window.Shopify.designMode) return;

      const section = this.closest('.shopify-section');
      if (!section) return;

      document.addEventListener('shopify:section:select', (event) => {
        if (event.target === section) this.toggle(true);
      });
      document.addEventListener('shopify:section:deselect', (event) => {
        if (event.target === section) this.toggle(false);
      });
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
      if (this.buyBoxObserver) this.buyBoxObserver.disconnect();
      if (this.onScroll) window.removeEventListener('scroll', this.onScroll);
    }

    toggle(show) {
      if (show === this.shown) return;
      this.shown = show;

      if (show) {
        this.hidden = false;
        // Let the browser paint the hidden state before transitioning in,
        // otherwise the bar snaps into place instead of sliding.
        window.requestAnimationFrame(() => this.classList.add('ces-sticky-atc--visible'));
      } else {
        this.classList.remove('ces-sticky-atc--visible');
      }
    }
  }

  customElements.define('ces-sticky-atc', CesStickyAtc);
}
