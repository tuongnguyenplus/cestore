/*
 * <ces-review-slider>
 *
 * The review carousel in sections/ces-testimonial-marquee.liquid.
 *
 * Scrolling is the browser's own: the track is an overflow-x container with
 * scroll snapping, so swipe, trackpad and keyboard scrolling all work before
 * this file loads and keep working if it fails. What the element adds is the
 * previous/next buttons, the dots, and keeping both in sync with wherever the
 * reader has scrolled to.
 */
if (!customElements.get('ces-review-slider')) {
  class CesReviewSlider extends HTMLElement {
    connectedCallback() {
      if (this.initialised) return;

      this.track = this.querySelector('[data-ces-slider-track]');
      this.slides = Array.from(this.querySelectorAll('[data-ces-slider-slide]'));
      this.previous = this.querySelector('[data-ces-slider-prev]');
      this.next = this.querySelector('[data-ces-slider-next]');
      this.dotsContainer = this.querySelector('[data-ces-slider-dots]');

      if (!this.track || this.slides.length === 0) return;

      this.initialised = true;
      this.index = 0;

      // A single slide has nothing to page through.
      if (this.slides.length < 2) {
        this.classList.add('ces-testimonial-marquee__slider--static');
        return;
      }

      this.buildDots();

      if (this.previous) this.previous.addEventListener('click', () => this.go(this.index - 1));
      if (this.next) this.next.addEventListener('click', () => this.go(this.index + 1));

      this.onScroll = this.onScroll.bind(this);
      this.track.addEventListener('scroll', this.onScroll, { passive: true });

      if (typeof ResizeObserver === 'function') {
        this.observer = new ResizeObserver(() => this.sync());
        this.observer.observe(this.track);
      }

      this.sync();
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
      if (this.track) this.track.removeEventListener('scroll', this.onScroll);
      if (this.frame) window.cancelAnimationFrame(this.frame);
    }

    get prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    buildDots() {
      if (!this.dotsContainer) return;

      this.dots = this.slides.map((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'ces-testimonial-marquee__dot';
        dot.innerHTML = `<span class="ces-visually-hidden">Go to review ${index + 1}</span>`;
        dot.addEventListener('click', () => this.go(index));
        this.dotsContainer.appendChild(dot);
        return dot;
      });
    }

    go(index) {
      const clamped = Math.max(0, Math.min(index, this.slides.length - 1));
      const slide = this.slides[clamped];
      if (!slide) return;

      this.track.scrollTo({
        left: slide.offsetLeft - this.track.offsetLeft,
        behavior: this.prefersReducedMotion ? 'auto' : 'smooth',
      });
    }

    onScroll() {
      if (this.frame) window.cancelAnimationFrame(this.frame);
      this.frame = window.requestAnimationFrame(() => this.sync());
    }

    /*
     * Derives the current slide from the actual scroll position rather than
     * tracking it separately, so a swipe, a click and a keyboard scroll all end
     * up describing the same state.
     */
    sync() {
      const origin = this.track.scrollLeft + this.track.offsetLeft;

      let closest = 0;
      let smallest = Infinity;

      this.slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft - origin);
        if (distance < smallest) {
          smallest = distance;
          closest = index;
        }
      });

      this.index = closest;

      // Compare against the real scroll extent: with several slides visible at
      // once the last slide can never reach the left edge, and the next button
      // has to disable at the end of the scroll, not at the last index.
      const atStart = this.track.scrollLeft <= 1;
      const atEnd = this.track.scrollLeft >= this.track.scrollWidth - this.track.clientWidth - 1;

      if (this.previous) this.previous.disabled = atStart;
      if (this.next) this.next.disabled = atEnd;

      if (!this.dots) return;

      this.dots.forEach((dot, index) => {
        const current = index === this.index;
        dot.classList.toggle('ces-testimonial-marquee__dot--active', current);
        dot.setAttribute('aria-current', current ? 'true' : 'false');
      });
    }
  }

  customElements.define('ces-review-slider', CesReviewSlider);
}
