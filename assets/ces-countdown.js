/*
 * <ces-countdown>
 *
 * Drives the clock in sections/ces-countdown-bar.liquid. Two modes:
 *
 * - data-deadline: a real moment the offer ends. Every shopper sees the same
 *   number, and when it passes the bar says so instead of looping.
 * - data-minutes: a per-shopper window. The end time is written to
 *   localStorage under data-key, so a refresh or a second visit carries on
 *   from where it was rather than resetting to the full duration — a timer
 *   that restarts on every page view is telling the shopper something untrue.
 *
 * The markup ships with a sensible first frame rendered server side, so the
 * bar reads correctly before this file runs and in the theme editor.
 */
if (!customElements.get('ces-countdown')) {
  class CesCountdown extends HTMLElement {
    connectedCallback() {
      if (this.timer) return;

      this.parts = {
        days: this.querySelector('[data-ces-cd-days]'),
        hours: this.querySelector('[data-ces-cd-hours]'),
        minutes: this.querySelector('[data-ces-cd-minutes]'),
        seconds: this.querySelector('[data-ces-cd-seconds]'),
      };
      this.clock = this.querySelector('[data-ces-cd-clock]');
      this.expired = this.querySelector('[data-ces-cd-expired]');

      this.end = this.resolveEnd();
      if (!this.end) return;

      this.tick();
      this.timer = window.setInterval(() => this.tick(), 1000);
    }

    disconnectedCallback() {
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
    }

    resolveEnd() {
      const deadline = this.dataset.deadline;
      if (deadline) {
        // Accept "2026-10-31 23:59" as well as full ISO; Safari rejects the
        // space form, so normalise it before parsing.
        const parsed = Date.parse(deadline.trim().replace(' ', 'T'));
        return isNaN(parsed) ? null : parsed;
      }

      const minutes = parseFloat(this.dataset.minutes);
      if (!minutes || minutes <= 0) return null;

      const span = minutes * 60000;
      const key = this.dataset.key;
      const stored = key ? this.read(key) : null;

      // Reuse a stored end time only while it is both still in the future and
      // no further away than the window itself — a merchant shortening the
      // duration should not leave old visitors on the longer clock.
      if (stored && stored > Date.now() && stored - Date.now() <= span) return stored;

      const end = Date.now() + span;
      if (key) this.write(key, end);
      return end;
    }

    read(key) {
      try {
        const raw = window.localStorage.getItem(key);
        const value = raw ? parseInt(raw, 10) : NaN;
        return isNaN(value) ? null : value;
      } catch (e) {
        // Private mode, or site data blocked. The clock still runs, it just
        // starts fresh each visit.
        return null;
      }
    }

    write(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
      } catch (e) {
        /* nothing to do — see read() */
      }
    }

    tick() {
      let left = Math.floor((this.end - Date.now()) / 1000);

      if (left <= 0) {
        this.finish();
        return;
      }

      const seconds = left % 60;
      left = Math.floor(left / 60);
      const minutes = left % 60;
      left = Math.floor(left / 60);

      // Without a days box the hours keep counting past 24 rather than
      // silently dropping whole days off the clock.
      const hours = this.parts.days ? left % 24 : left;
      const days = Math.floor(left / 24);

      this.set(this.parts.days, days);
      this.set(this.parts.hours, hours);
      this.set(this.parts.minutes, minutes);
      this.set(this.parts.seconds, seconds);
    }

    set(el, value) {
      if (!el) return;
      const text = value < 10 ? '0' + value : String(value);
      if (el.textContent !== text) el.textContent = text;
    }

    finish() {
      this.disconnectedCallback();
      if (this.expired) {
        if (this.clock) this.clock.hidden = true;
        this.expired.hidden = false;
      } else {
        this.set(this.parts.days, 0);
        this.set(this.parts.hours, 0);
        this.set(this.parts.minutes, 0);
        this.set(this.parts.seconds, 0);
      }
    }
  }

  customElements.define('ces-countdown', CesCountdown);
}
