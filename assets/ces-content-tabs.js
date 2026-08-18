/*
 * <ces-tabs>
 *
 * Tab switching for sections/ces-content-tabs.liquid.
 *
 * The section renders every panel visible and un-hidden, so with JavaScript off
 * the page is simply a stack of headed sections — nothing is unreachable. This
 * element collapses that stack into a tablist, wiring up the ARIA roles and the
 * arrow-key behaviour expected of one.
 */
if (!customElements.get('ces-tabs')) {
  class CesTabs extends HTMLElement {
    connectedCallback() {
      if (this.initialised) return;

      this.tabs = Array.from(this.querySelectorAll('[data-ces-tab]'));
      this.panels = Array.from(this.querySelectorAll('[data-ces-tab-panel]'));

      if (this.tabs.length === 0 || this.tabs.length !== this.panels.length) return;

      this.initialised = true;
      this.classList.add('ces-content-tabs--enhanced');

      this.tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => this.select(index));
        tab.addEventListener('keydown', (event) => this.onKeydown(event, index));
      });

      const initial = this.tabs.findIndex((tab) => tab.dataset.cesTabDefault !== undefined);
      this.select(initial === -1 ? 0 : initial, { focus: false });
    }

    select(index, { focus = true } = {}) {
      this.tabs.forEach((tab, i) => {
        const current = i === index;
        tab.setAttribute('aria-selected', current ? 'true' : 'false');
        // Only the active tab stays in the tab order; the arrow keys move
        // between them from there, which is how a tablist is meant to behave.
        tab.setAttribute('tabindex', current ? '0' : '-1');
        tab.classList.toggle('ces-content-tabs__tab--active', current);
        this.panels[i].hidden = !current;
      });

      if (focus) this.tabs[index].focus();
    }

    onKeydown(event, index) {
      const last = this.tabs.length - 1;
      let target = null;

      switch (event.key) {
        case 'ArrowRight':
          target = index === last ? 0 : index + 1;
          break;
        case 'ArrowLeft':
          target = index === 0 ? last : index - 1;
          break;
        case 'Home':
          target = 0;
          break;
        case 'End':
          target = last;
          break;
        default:
          return;
      }

      event.preventDefault();
      this.select(target);
    }
  }

  customElements.define('ces-tabs', CesTabs);
}
