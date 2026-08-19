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
      const revealTarget = (revealId && document.getElementById(revealId)) || this.target;

      if (!revealTarget || typeof IntersectionObserver !== 'function') return;

      this.initialised = true;

      this.observer = new IntersectionObserver(
        ([entry]) => {
          // Show once the trigger has been scrolled up out of the viewport, not
          // while it is still below the fold on the way down.
          const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          this.toggle(scrolledPast);
        },
        { threshold: 0 }
      );
      this.observer.observe(revealTarget);
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
