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
      const targetId = this.dataset.target;
      this.target = targetId ? document.getElementById(targetId) : null;

      const revealId = this.dataset.reveal;
      let revealTarget = revealId ? document.getElementById(revealId) : null;

      if (revealId && !revealTarget) {
        // An id typed into a theme setting is the one thing here that can be
        // wrong, and the bar used to answer that by doing nothing at all.
        console.warn(
          '[ces] Sticky bar: no element with id "' + revealId + '". Falling back to the first section.'
        );
      }

      // Then the buy box it scrolls to, then whatever the page opens with.
      revealTarget =
        revealTarget ||
        this.target ||
        document.querySelector('#MainContent .shopify-section, main .shopify-section, .shopify-section');

      this.initialised = true;

      if (revealTarget && typeof IntersectionObserver === 'function') {
        this.observer = new IntersectionObserver(
          ([entry]) => {
            // Show once the trigger has been scrolled up out of the viewport,
            // not while it is still below the fold on the way down.
            const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            this.toggle(scrolledPast);
          },
          { threshold: 0 }
        );
        this.observer.observe(revealTarget);
        return;
      }

      // Nothing to watch: show the bar once a screenful has been scrolled.
      // A bar that never appears is worse than one that appears a little early.
      this.onScroll = () => this.toggle(window.scrollY > window.innerHeight * 0.9);
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.onScroll();
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
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
