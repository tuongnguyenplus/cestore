/*
 * <ces-video-row>
 *
 * Lazily loads and plays the short customer videos in
 * sections/ces-video-testimonial-row.liquid.
 *
 * Each <video> ships with preload="none" and its <source> URLs parked in
 * data-src, so a page with four testimonials downloads no video bytes at all
 * until one is close to the viewport. An IntersectionObserver attaches the real
 * sources shortly before a clip scrolls in, plays it muted, and pauses it again
 * on the way out so off-screen clips stop competing for bandwidth and battery.
 */
if (!customElements.get('ces-video-row')) {
  class CesVideoRow extends HTMLElement {
    // Start fetching a little before the clip is actually visible.
    static rootMargin = '200px 0px';
    // Play once a quarter of the clip is on screen; pause when it drops below.
    static threshold = 0.25;

    connectedCallback() {
      if (this.initialised) return;

      this.videos = Array.from(this.querySelectorAll('[data-ces-video]'));
      if (!this.videos.length) return;

      this.initialised = true;
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.autoplay = this.hasAttribute('data-autoplay');

      this.setupSoundToggles();
      this.setupPlayToggles();

      if (typeof IntersectionObserver !== 'function') {
        // No observer: load everything up front rather than showing dead frames.
        this.videos.forEach((video) => this.load(video));
        return;
      }

      this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
        rootMargin: CesVideoRow.rootMargin,
        threshold: [0, CesVideoRow.threshold],
      });

      this.videos.forEach((video) => this.observer.observe(video));
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
    }

    onIntersect(entries) {
      entries.forEach((entry) => {
        const video = entry.target;

        if (!entry.isIntersecting) {
          if (!video.paused) video.pause();
          return;
        }

        this.load(video);

        // Autoplay is a motion effect, and it is also a merchant choice. Either
        // way the poster stays up and the play button remains the way in.
        if (!this.autoplay) return;
        if (this.motionQuery.matches) return;
        if (entry.intersectionRatio < CesVideoRow.threshold) return;

        // Rejected autoplay is normal on some devices and not worth reporting;
        // the poster stays up and the controls remain usable.
        const played = video.play();
        if (played && typeof played.catch === 'function') played.catch(() => {});
      });
    }

    load(video) {
      if (video.dataset.cesLoaded) return;
      video.dataset.cesLoaded = 'true';

      const sources = video.querySelectorAll('source[data-src]');
      if (!sources.length) return;

      sources.forEach((source) => {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
      });

      video.load();
    }

    setupPlayToggles() {
      this.querySelectorAll('[data-ces-video-play]').forEach((button) => {
        const frame = button.closest('.ces-video-testimonial-row__frame');
        const video = frame && frame.querySelector('[data-ces-video]');
        if (!video) return;

        button.addEventListener('click', () => {
          if (video.paused) {
            this.load(video);
            const played = video.play();
            if (played && typeof played.catch === 'function') played.catch(() => {});
          } else {
            video.pause();
          }
        });

        // Driven by the media element rather than the click, so the button
        // stays honest when playback starts or stops for any other reason.
        video.addEventListener('play', () => this.setPlayState(button, true));
        video.addEventListener('pause', () => this.setPlayState(button, false));
      });
    }

    setPlayState(button, playing) {
      button.setAttribute('aria-pressed', playing ? 'true' : 'false');
      button.classList.toggle('ces-video-testimonial-row__play--playing', playing);

      const label = button.querySelector('[data-ces-video-play-label]');
      if (label) label.textContent = playing ? 'Pause video' : 'Play video';
    }

    setupSoundToggles() {
      this.querySelectorAll('[data-ces-video-sound]').forEach((button) => {
        const frame = button.closest('.ces-video-testimonial-row__frame');
        const video = frame && frame.querySelector('[data-ces-video]');
        if (!video) return;

        button.addEventListener('click', () => this.toggleSound(button, video));
      });
    }

    toggleSound(button, video) {
      const unmuting = video.muted;

      if (unmuting) {
        // Only one clip should be audible at a time.
        this.videos.forEach((other) => {
          if (other !== video) other.muted = true;
        });
        this.querySelectorAll('[data-ces-video-sound]').forEach((other) => {
          if (other !== button) this.setSoundState(other, false);
        });

        const played = video.play();
        if (played && typeof played.catch === 'function') played.catch(() => {});
      }

      video.muted = !unmuting;
      this.setSoundState(button, unmuting);
    }

    setSoundState(button, on) {
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.classList.toggle('ces-video-testimonial-row__sound--on', on);

      const label = button.querySelector('[data-ces-video-sound-label]');
      if (label) label.textContent = on ? 'Mute video' : 'Unmute video';
    }
  }

  customElements.define('ces-video-row', CesVideoRow);
}
