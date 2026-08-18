/*
 * <ces-timeline>
 *
 * Advances the highlighted step in sections/ces-timeline-accordion.liquid as
 * the reader scrolls, so the sequence fills in behind them rather than sitting
 * frozen on step one.
 *
 * Only steps left on the automatic setting take part; a step a merchant has
 * pinned to highlighted or muted keeps whatever they chose. Activation is
 * one-way — a step already reached stays reached when scrolling back up, which
 * is what makes it read as progress rather than a hover effect.
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

      this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
        // Fires once a step has climbed into the lower-middle of the screen,
        // roughly where the reader is looking.
        rootMargin: '-45% 0px -25% 0px',
        threshold: 0,
      });

      this.steps.forEach((step) => this.observer.observe(step));
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
    }

    onIntersect(entries) {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        this.activate(entry.target);
        // Reached steps stay reached, so nothing needs watching twice.
        if (this.observer) this.observer.unobserve(entry.target);
      });
    }

    activate(step) {
      step.classList.remove('ces-timeline__step--muted');
      step.classList.add('ces-timeline__step--active');
    }
  }

  customElements.define('ces-timeline', CesTimeline);
}
