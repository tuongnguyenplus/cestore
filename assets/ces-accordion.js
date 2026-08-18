/*
 * <ces-accordion-item>
 *
 * Progressive enhancement for the native <details> markup rendered by
 * snippets/ces-accordion-item.liquid. Without this file the rows still open and
 * close correctly; with it they animate and keep aria-expanded accurate.
 *
 * Follows Dawn's <details-disclosure> pattern: a small custom element that
 * decorates existing markup rather than rendering any of it.
 */
if (!customElements.get('ces-accordion-item')) {
  class CesAccordionItem extends HTMLElement {
    static duration = 260;

    connectedCallback() {
      if (this.initialised) return;

      this.details = this.querySelector('details');
      this.summary = this.details && this.details.querySelector('summary');
      this.content = this.details && this.details.querySelector('[data-ces-accordion-content]');

      if (!this.details || !this.summary || !this.content) return;

      this.initialised = true;
      this.animation = null;

      this.onSummaryClick = this.onSummaryClick.bind(this);
      this.onToggle = this.onToggle.bind(this);

      this.summary.addEventListener('click', this.onSummaryClick);
      // A row in a native exclusive group (<details name="...">) is closed by
      // the browser without a click, so mirror aria-expanded from the source.
      this.details.addEventListener('toggle', this.onToggle);

      this.onToggle();
    }

    disconnectedCallback() {
      if (!this.initialised) return;
      this.summary.removeEventListener('click', this.onSummaryClick);
      this.details.removeEventListener('toggle', this.onToggle);
    }

    get prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    onToggle() {
      this.summary.setAttribute('aria-expanded', this.details.open ? 'true' : 'false');
    }

    onSummaryClick(event) {
      if (this.prefersReducedMotion || typeof this.content.animate !== 'function') return;

      event.preventDefault();

      if (this.details.open) {
        this.shrink();
      } else {
        this.expand();
      }
    }

    expand() {
      this.cancelAnimation();
      this.details.open = true;

      const height = this.content.scrollHeight;
      this.content.style.overflow = 'hidden';

      this.animation = this.content.animate(
        { height: ['0px', `${height}px`], opacity: [0, 1] },
        { duration: CesAccordionItem.duration, easing: 'ease-out' }
      );

      this.settle(this.animation);
    }

    shrink() {
      this.cancelAnimation();

      const height = this.content.getBoundingClientRect().height;
      this.content.style.overflow = 'hidden';

      this.animation = this.content.animate(
        { height: [`${height}px`, '0px'], opacity: [1, 0] },
        { duration: CesAccordionItem.duration, easing: 'ease-in' }
      );

      this.settle(this.animation, () => {
        this.details.open = false;
      });
    }

    cancelAnimation() {
      if (!this.animation) return;
      this.animation.cancel();
      this.animation = null;
    }

    settle(animation, onFinish) {
      animation.finished
        .then(() => {
          if (this.animation !== animation) return;
          if (onFinish) onFinish();
          this.content.style.overflow = '';
          this.animation = null;
        })
        // A cancelled animation rejects; the replacement run owns the cleanup.
        .catch(() => {});
    }
  }

  customElements.define('ces-accordion-item', CesAccordionItem);
}
