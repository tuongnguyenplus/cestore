/*
 * ces-bundle
 * A tiered bundle selector. Each tier maps to a product variant. Radios pick a
 * tier; Add to cart adds that variant (plus any "real" free-item variants for
 * the tier) via AJAX and re-renders / opens the cart drawer.
 */
class CesBundle extends HTMLElement {
  connectedCallback() {
    this.cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    this.addBtn = this.querySelector('[data-ces-bundle-add]');
    this.errorEl = this.querySelector('[data-ces-bundle-error]');
    this.totalEl = this.querySelector('[data-ces-bundle-total]');
    this.radios = Array.from(this.querySelectorAll('.ces-bundle__radio'));

    this.radios.forEach((radio) => radio.addEventListener('change', () => this.sync()));
    this.sync();

    if (this.addBtn) this.addBtn.addEventListener('click', () => this.add());
  }

  get selected() {
    return this.radios.find((radio) => radio.checked) || this.radios[0];
  }

  sync() {
    this.radios.forEach((radio) => {
      const tier = radio.closest('.ces-bundle__tier');
      if (tier) tier.classList.toggle('is-selected', radio.checked);
    });
    const radio = this.selected;
    if (radio && this.totalEl) this.totalEl.textContent = radio.dataset.priceLabel || '';
    if (radio && this.addBtn) this.addBtn.disabled = radio.dataset.unavailable === 'true';
  }

  baseConfig() {
    const config =
      typeof fetchConfig === 'function'
        ? fetchConfig('javascript')
        : { method: 'POST', headers: { Accept: 'application/javascript' } };
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    // Multipart FormData is Dawn's proven cart path (JSON bodies don't reliably
    // echo the `sections` payload the drawer needs).
    delete config.headers['Content-Type'];
    return config;
  }

  // Add a single variant. When `withSections` is true, ask Shopify to return the
  // rendered drawer sections — only the single-item form reliably echoes them,
  // so we do this on the last (main) add and render from its response.
  addLine(id, quantity, withSections) {
    const config = this.baseConfig();
    const formData = new FormData();
    formData.append('id', id);
    formData.append('quantity', quantity);
    if (withSections && this.cart && typeof this.cart.getSectionsToRender === 'function') {
      formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
      if (typeof this.cart.setActiveElement === 'function') this.cart.setActiveElement(document.activeElement);
    }
    config.body = formData;
    return fetch(`${window.routes.cart_add_url}`, config).then((response) => response.json());
  }

  add() {
    const radio = this.selected;
    if (!radio) return;
    if (radio.dataset.unavailable === 'true' || !radio.dataset.variantId) {
      this.showError('Sorry, this option is currently unavailable.');
      return;
    }

    const mainId = parseInt(radio.dataset.variantId, 10);
    const mainQty = parseInt(radio.dataset.quantity, 10) || 1;
    const freeIds = (radio.dataset.freeIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((fid) => parseInt(fid, 10))
      .filter((n) => !isNaN(n));

    this.setLoading(true);
    this.hideError();

    // Add the free items first (no sections), then the main variant last with
    // sections, so the response we render reflects the full cart.
    let chain = Promise.resolve();
    freeIds.forEach((fid) => {
      chain = chain.then(() => this.addLine(fid, 1, false));
    });

    chain
      .then(() => this.addLine(mainId, mainQty, true))
      .then((response) => {
        if (response && response.status) {
          this.showError(response.description || response.message || 'Could not add to cart.');
          this.setLoading(false);
          return;
        }
        if (this.cart && typeof this.cart.renderContents === 'function' && response && response.sections) {
          try {
            if (this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            this.cart.renderContents(response);
            if (
              this.dataset.openDrawer !== 'false' &&
              typeof this.cart.open === 'function' &&
              !this.cart.classList.contains('active')
            ) {
              this.cart.open();
            }
          } catch (e) {
            // Items were added; if the drawer can't re-render, fall back to the cart page.
            window.location = window.routes.cart_url;
            return;
          }
        } else {
          window.location = window.routes.cart_url;
          return;
        }
        this.setLoading(false);
      })
      .catch(() => {
        this.showError('Something went wrong. Please try again.');
        this.setLoading(false);
      });
  }

  setLoading(state) {
    if (!this.addBtn) return;
    this.addBtn.classList.toggle('is-loading', state);
    this.addBtn.setAttribute('aria-busy', state ? 'true' : 'false');
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

if (!customElements.get('ces-bundle')) customElements.define('ces-bundle', CesBundle);
