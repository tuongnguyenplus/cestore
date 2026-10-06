/*
 * <ces-review-carousel>
 *
 * Arrows and dots for the card track in sections/ces-review-cards.liquid.
 *
 * The track is a scroll-snap container rather than a translated strip, so
 * swiping, momentum, keyboard scrolling and focus all work before this file
 * loads and keep working if it fails. All this element adds is the two
 * buttons, the dots, and keeping them in step with where the track has been
 * scrolled to.
 */
if (!customElements.get('ces-review-carousel')) {
  class CesReviewCarousel extends HTMLElement {
    connectedCallback() {
      if (this.track) return;

      this.track = this.querySelector('[data-ces-rc-track]');
      this.prev = this.querySelector('[data-ces-rc-prev]');
      this.next = this.querySelector('[data-ces-rc-next]');
      this.dots = Array.from(this.querySelectorAll('[data-ces-rc-dot]'));
      if (!this.track) return;

      this.cards = Array.from(this.track.children);
      if (!this.cards.length) return;

      this.onScroll = this.debounce(() => this.sync(), 80);
      this.track.addEventListener('scroll', this.onScroll, { passive: true });

      if (this.prev) this.prev.addEventListener('click', () => this.page(-1));
      if (this.next) this.next.addEventListener('click', () => this.page(1));

      this.dots.forEach((dot, i) => {
        dot.addEventListener('click', () => this.goTo(i * this.perView()));
      });

      if (typeof ResizeObserver === 'function') {
        this.observer = new ResizeObserver(this.debounce(() => this.sync(), 120));
        this.observer.observe(this);
      }

      this.sync();
    }

    disconnectedCallback() {
      if (this.track) this.track.removeEventListener('scroll', this.onScroll);
      if (this.observer) this.observer.disconnect();
    }

    debounce(fn, wait) {
      let t;
      return () => {
        window.clearTimeout(t);
        t = window.setTimeout(fn, wait);
      };
    }

    // How many cards are on screen at once, from measurement rather than a
    // breakpoint, so it stays right whatever the column count is set to.
    perView() {
      const card = this.cards[0];
      if (!card) return 1;
      const width = card.getBoundingClientRect().width;
      if (!width) return 1;
      return Math.max(1, Math.round(this.track.clientWidth / width));
    }

    pages() {
      return Math.max(1, Math.ceil(this.cards.length / this.perView()));
    }

    currentIndex() {
      const left = this.track.scrollLeft;
      let closest = 0;
      let best = Infinity;
      this.cards.forEach((card, i) => {
        const d = Math.abs(card.offsetLeft - this.track.offsetLeft - left);
        if (d < best) {
          best = d;
          closest = i;
        }
      });
      return closest;
    }

    goTo(index) {
      const card = this.cards[Math.max(0, Math.min(index, this.cards.length - 1))];
      if (!card) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.track.scrollTo({
        left: card.offsetLeft - this.track.offsetLeft,
        behavior: reduce ? 'auto' : 'smooth',
      });
    }

    page(direction) {
      this.goTo(this.currentIndex() + direction * this.perView());
    }

    sync() {
      const per = this.perView();
      const pages = this.pages();
      const page = Math.min(pages - 1, Math.floor(this.currentIndex() / per));

      this.dots.forEach((dot, i) => {
        const on = i === page;
        dot.classList.toggle('is-active', on);
        dot.setAttribute('aria-current', on ? 'true' : 'false');
        // A dot for a page that does not exist at this width is no use.
        dot.hidden = i >= pages;
      });

      // At the ends the buttons have nowhere to go, and a control that does
      // nothing is worse than one that is plainly unavailable.
      const atStart = this.track.scrollLeft <= 1;
      const atEnd = this.track.scrollLeft + this.track.clientWidth >= this.track.scrollWidth - 1;
      if (this.prev) this.prev.disabled = atStart;
      if (this.next) this.next.disabled = atEnd;

      const single = pages <= 1;
      this.classList.toggle('ces-rc--single', single);
    }
  }

  customElements.define('ces-review-carousel', CesReviewCarousel);
}
