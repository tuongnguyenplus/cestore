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

      const id = this.dataset.target;
      this.target = id ? document.getElementById(id) : null;

      // Without a buy box to track there is nothing to scroll back to, so the
      // bar stays hidden rather than pointing at a dead anchor.
      if (!this.target || typeof IntersectionObserver !== 'function') return;

      this.initialised = true;

      this.observer = new IntersectionObserver(
        ([entry]) => this.toggle(!entry.isIntersecting),
        { threshold: 0 }
      );
      this.observer.observe(this.target);
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
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
