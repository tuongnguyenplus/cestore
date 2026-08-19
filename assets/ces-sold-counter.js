/*
 * <ces-sold-counter> — a live "units sold" number that ticks upward.
 *
 * The merchant sets a starting number and up to three increments. Each
 * increment runs on its own fixed cadence: step 1 every second, step 2 every
 * two seconds, step 3 every three seconds. Running together they make the
 * count climb in an organic, accelerating way rather than at one flat rate.
 *
 * Counting starts only once the element scrolls into view, so a shopper sees
 * it move. It honours prefers-reduced-motion and a data-static opt-out by
 * simply showing the formatted starting number.
 */
if (!customElements.get('ces-sold-counter')) {
  class CesSoldCounter extends HTMLElement {
    connectedCallback() {
      this.current = parseInt(this.dataset.base, 10) || 0;
      this.render();

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.hasAttribute('data-static') || reduceMotion) return;

      this.steps = [
        { amount: parseInt(this.dataset.step1, 10) || 0, interval: 1000 },
        { amount: parseInt(this.dataset.step2, 10) || 0, interval: 2000 },
        { amount: parseInt(this.dataset.step3, 10) || 0, interval: 3000 },
      ].filter((step) => step.amount > 0);

      if (this.steps.length === 0) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.start();
            this.observer.disconnect();
            this.observer = null;
          }
        },
        { threshold: 0 }
      );
      this.observer.observe(this);
    }

    start() {
      this.timers = this.steps.map((step) =>
        window.setInterval(() => {
          this.current += step.amount;
          this.render();
        }, step.interval)
      );
    }

    render() {
      this.textContent = this.current.toLocaleString();
    }

    disconnectedCallback() {
      (this.timers || []).forEach((id) => window.clearInterval(id));
      if (this.observer) this.observer.disconnect();
    }
  }

  customElements.define('ces-sold-counter', CesSoldCounter);
}
