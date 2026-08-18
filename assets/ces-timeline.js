/*
 * <ces-timeline>
 *
 * Advances the highlighted step in sections/ces-timeline-accordion.liquid as
 * the reader scrolls, so the sequence fills in behind them rather than sitting
 * frozen on step one.
 *
 * Only steps left on the automatic setting take part; a step a merchant has
 * pinned to highlighted or muted keeps whatever they chose.
 *
 * State tracks the scroll position in both directions: everything above the
 * reader is lit, everything below is still muted. Scrolling back up therefore
 * unwinds the fill, so the highlight always says "you are here" rather than
 * "here is how far you once got".
 */
if (!customElements.get('ces-timeline')) {
  class CesTimeline extends HTMLElement {
    connectedCallback() {
      if (this.initialised) return;

      this.steps = Array.from(this.querySelectorAll('[data-ces-timeline-auto]'));
      if (!this.steps.length) return;

      this.initialised = true;

      // A progressive reveal is a scroll effect, so honour a reduced-motion
      // preference by simply showing the finished state.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || typeof IntersectionObserver !== 'function') {
        this.steps.forEach((step) => this.activate(step));
        return;
      }

      // A narrow band across the lower middle of the screen, roughly where the
      // reader's attention sits. A step is lit from the moment it reaches the
      // band and stays lit while it is anywhere above it.
      this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
        rootMargin: '-55% 0px -25% 0px',
        threshold: 0,
      });

      this.steps.forEach((step) => this.observer.observe(step));
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
    }

    onIntersect(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.activate(entry.target);
          return;
        }

        // Left the band — but which way? Above it means the reader has already
        // passed the step, so it stays lit; below means they have not reached
        // it yet. rootBounds is null in a few edge cases, and leaving the step
        // as it is beats guessing.
        const root = entry.rootBounds;
        if (!root) return;

        this.setState(entry.target, entry.boundingClientRect.top < root.top);
      });
    }

    activate(step) {
      this.setState(step, true);
    }

    setState(step, lit) {
      step.classList.toggle('ces-timeline__step--active', lit);
      step.classList.toggle('ces-timeline__step--muted', !lit);
    }
  }

  customElements.define('ces-timeline', CesTimeline);
}
