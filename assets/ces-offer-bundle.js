/*
 * ces-offer-bundle
 * A tiered offer selector (e.g. 3+1 / 6+2 / 12+4). Radios pick a tier;
 * Add to cart adds the selected tier's variant × quantity via AJAX and
 * re-renders / opens the cart drawer.
 */
class CesOfferBundle extends HTMLElement {
  connectedCallback() {
    this.cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    this.addBtn = this.querySelector('[data-ces-offer-add]');
    this.errorEl = this.querySelector('.ces-offer__error');
    this.radios = Array.from(this.querySelectorAll('.ces-offer__radio'));

    this.radios.forEach((radio) => radio.addEventListener('change', () => this.syncSelected()));
    this.syncSelected();

    if (this.addBtn) this.addBtn.addEventListener('click', () => this.add());
  }

  syncSelected() {
    this.radios.forEach((radio) => {
      const tier = radio.closest('.ces-offer__tier');
      if (tier) tier.classList.toggle('is-selected', radio.checked);
    });
  }

  get selected() {
    return this.radios.find((radio) => radio.checked) || this.radios[0];
  }

  add() {
    const radio = this.selected;
    if (!radio) return;

    const id = radio.dataset.variantId;
    const quantity = parseInt(radio.dataset.quantity, 10) || 1;

    if (!id || radio.dataset.unavailable === 'true') {
      this.showError('Sorry, this option is currently unavailable.');
      return;
    }

    this.setLoading(true);
    this.hideError();

    const config =
      typeof fetchConfig === 'function'
        ? fetchConfig('javascript')
        : { method: 'POST', headers: { Accept: 'application/javascript' } };
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    const formData = new FormData();
    formData.append('id', id);
    formData.append('quantity', quantity);
    if (this.cart && typeof this.cart.getSectionsToRender === 'function') {
      formData.append(
        'sections',
        this.cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append('sections_url', window.location.pathname);
      if (typeof this.cart.setActiveElement === 'function') this.cart.setActiveElement(document.activeElement);
    }
    config.body = formData;

    fetch(`${window.routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          this.showError(response.description || response.message || 'Could not add to cart.');
          this.setLoading(false);
          return;
        }
        if (this.cart && typeof this.cart.renderContents === 'function') {
          if (this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          this.cart.renderContents(response);
          if (
            this.dataset.openDrawer !== 'false' &&
            typeof this.cart.open === 'function' &&
            !this.cart.classList.contains('active')
          ) {
            this.cart.open();
          }
        } else {
          window.location = window.routes.cart_url;
        }
        this.setLoading(false);
      })
      .catch(() => {
        this.showError('Something went wrong. Please try again.');
        this.setLoading(false);
      });
  }

  setLoading(on) {
    if (!this.addBtn) return;
    this.addBtn.classList.toggle('loading', on);
    this.addBtn.disabled = on;
  }

  showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  hideError() {
    if (this.errorEl) this.errorEl.hidden = true;
  }
}

if (!customElements.get('ces-offer-bundle')) {
  customElements.define('ces-offer-bundle', CesOfferBundle);
}
