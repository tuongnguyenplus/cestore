/*
 * <ces-faq-page> — search, category filter and accordion for the FAQ page,
 * scoped to its own element so several could coexist on a page.
 */
if (!customElements.get('ces-faq-page')) {
  class CesFaqPage extends HTMLElement {
    connectedCallback() {
      this.qas = Array.prototype.slice.call(this.querySelectorAll('.ces-faqp__qa'));
      this.secs = Array.prototype.slice.call(this.querySelectorAll('.ces-faqp__sec'));
      this.chips = Array.prototype.slice.call(this.querySelectorAll('.ces-faqp__chip'));
      this.input = this.querySelector('.ces-faqp__input');
      this.clear = this.querySelector('.ces-faqp__clear');
      this.empty = this.querySelector('.ces-faqp__empty');
      this.filter = 'all';

      this.qas.forEach((qa) => {
        const btn = qa.querySelector('.ces-faqp__q');
        if (!btn) return;
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
          const open = qa.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });

      this.chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          this.filter = chip.dataset.t;
          this.chips.forEach((x) => x.setAttribute('aria-pressed', x === chip ? 'true' : 'false'));
          this.apply();
        });
      });
      if (this.chips[0]) this.chips[0].setAttribute('aria-pressed', 'true');

      if (this.input) this.input.addEventListener('input', () => this.apply());
      if (this.clear) {
        this.clear.addEventListener('click', () => {
          this.input.value = '';
          this.apply();
          this.input.focus();
        });
      }
    }

    apply() {
      const term = (this.input ? this.input.value : '').trim().toLowerCase();
      if (this.clear) this.clear.style.display = term ? 'block' : 'none';
      let hits = 0;

      this.qas.forEach((qa) => {
        const sec = qa.closest('.ces-faqp__sec');
        const inCat = this.filter === 'all' || (sec && sec.dataset.t === this.filter);
        const match = !term || qa.textContent.toLowerCase().indexOf(term) > -1;
        const show = inCat && match;
        qa.style.display = show ? '' : 'none';
        if (show) hits++;

        const btn = qa.querySelector('.ces-faqp__q');
        if (term && show) {
          qa.classList.add('is-open');
          if (btn) btn.setAttribute('aria-expanded', 'true');
        } else if (!term) {
          qa.classList.remove('is-open');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });

      this.secs.forEach((sec) => {
        const any = Array.prototype.slice
          .call(sec.querySelectorAll('.ces-faqp__qa'))
          .some((q) => q.style.display !== 'none');
        sec.style.display = any ? '' : 'none';
      });

      if (this.empty) this.empty.style.display = hits ? 'none' : 'block';
    }
  }

  customElements.define('ces-faq-page', CesFaqPage);
}
