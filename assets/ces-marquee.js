/*
 * <ces-marquee>
 *
 * Progressive enhancement for snippets/ces-marquee.liquid. The CSS already
 * loops the strip on its own; this element does two things it cannot:
 *
 *   1. Tops the track up with extra clones when the rendered items are
 *      narrower than the viewport, so a short strip has no visible gap.
 *   2. Converts the speed setting (pixels per second) into an animation
 *      duration, so a three-item strip and a twenty-item strip travel at the
 *      same pace instead of the short one racing.
 */
if (!customElements.get('ces-marquee')) {
  class CesMarquee extends HTMLElement {
    connectedCallback() {
      if (this.initialised) return;

      this.track = this.querySelector('[data-ces-marquee-track]');
      this.source = this.querySelector('[data-ces-marquee-group]');

      if (!this.track || !this.source) return;

      this.initialised = true;

      // The snippet renders a second, identical group so the CSS loop is
      // seamless without JavaScript. It arrives carrying the same theme-editor
      // attributes as the original, so clean it before anything else runs.
      this.querySelectorAll('[data-ces-marquee-clone]').forEach((clone) => {
        CesMarquee.stripEditorAttributes(clone);
      });

      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.onMotionChange = this.layout.bind(this);
      this.motionQuery.addEventListener('change', this.onMotionChange);

      if (typeof ResizeObserver === 'function') {
        this.observer = new ResizeObserver(this.debounce(this.layout.bind(this)));
        this.observer.observe(this);
      }

      this.layout();
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
      if (this.motionQuery) this.motionQuery.removeEventListener('change', this.onMotionChange);
      if (this.frame) window.cancelAnimationFrame(this.frame);
    }

    get speed() {
      const speed = parseFloat(this.dataset.speed);
      return Number.isFinite(speed) && speed > 0 ? speed : 60;
    }

    debounce(callback) {
      return () => {
        if (this.frame) window.cancelAnimationFrame(this.frame);
        this.frame = window.requestAnimationFrame(callback);
      };
    }

    layout() {
      if (this.motionQuery.matches) {
        this.style.removeProperty('--ces-marquee-duration');
        return;
      }

      const groupWidth = this.source.getBoundingClientRect().width;
      if (!groupWidth) return;

      const groups = this.fill(groupWidth);

      // The keyframe translates the track by -50%, i.e. half of all groups.
      // Duration is that distance over the requested pixels-per-second so the
      // strip keeps a constant pace no matter how many clones were added.
      const distance = (groups / 2) * groupWidth;
      this.style.setProperty('--ces-marquee-duration', `${distance / this.speed}s`);
    }

    /*
     * The -50% keyframe assumes the track is two halves of identical content,
     * so the group count has to stay even. Clone in pairs until the track is at
     * least twice as wide as the element and no seam can enter the viewport.
     * Returns the resulting group count.
     */
    fill(groupWidth) {
      const width = this.getBoundingClientRect().width;
      if (!width) return this.track.children.length;

      const wanted = Math.max(2, Math.ceil(width / groupWidth) * 2);
      let groups = this.track.children.length;

      while (groups < wanted) {
        this.track.appendChild(this.buildClone());
        groups += 1;
      }

      return groups;
    }

    buildClone() {
      const clone = this.source.cloneNode(true);

      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-ces-marquee-clone', '');
      clone.removeAttribute('data-ces-marquee-group');

      CesMarquee.stripEditorAttributes(clone);

      return clone;
    }

    /*
     * Duplicated blocks must not answer to the theme editor, or clicking an
     * item in the editor would select a copy instead of the real block.
     */
    static stripEditorAttributes(root) {
      root.querySelectorAll('[data-shopify-editor-block]').forEach((node) => {
        node.removeAttribute('data-shopify-editor-block');
      });
    }
  }

  customElements.define('ces-marquee', CesMarquee);
}
