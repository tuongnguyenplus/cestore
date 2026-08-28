/*
 * ces-cart-maintenance
 * The "CEBEAM Maintenance Plan" opt-in inside the cart drawer. Toggling the
 * checkbox adds the maintenance variant (with its subscription selling_plan)
 * to the cart, or removes it, then re-renders the drawer.
 *
 * Real recurring billing requires the maintenance product to have a selling
 * plan from a Shopify subscription app; set the variant + selling_plan IDs in
 * Theme settings → Cart.
 */
class CesCartMaintenance extends HTMLElement {
  connectedCallback() {
    this.cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    this.variantId = this.dataset.variantId;
    this.sellingPlan = this.dataset.sellingPlan;
    this.toggle = this.querySelector('[data-ces-maint-toggle]');
    if (this.toggle) this.toggle.addEventListener('change', () => this.onToggle());
  }

  fetchConfigBase() {
    const config =
      typeof fetchConfig === 'function'
        ? fetchConfig('javascript')
        : { method: 'POST', headers: { Accept: 'application/javascript' } };
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Content-Type'] = 'application/json';
    return config;
  }

  sections() {
    if (this.cart && typeof this.cart.getSectionsToRender === 'function') {
      return {
        sections: this.cart.getSectionsToRender().map((s) => s.id),
        sections_url: window.location.pathname,
      };
    }
    return {};
  }

  render(response) {
    if (this.cart && typeof this.cart.renderContents === 'function') {
      if (this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
      this.cart.renderContents(response);
    } else {
      window.location.reload();
    }
  }

  setBusy(state) {
    this.classList.toggle('is-busy', state);
    if (this.toggle) this.toggle.disabled = state;
  }

  onToggle() {
    if (!this.variantId) return;
    this.setBusy(true);
    if (this.toggle.checked) this.add();
    else this.remove();
  }

  add() {
    const item = { id: parseInt(this.variantId, 10), quantity: 1 };
    if (this.sellingPlan) item.selling_plan = parseInt(this.sellingPlan, 10);
    const config = this.fetchConfigBase();
    config.body = JSON.stringify(Object.assign({ items: [item] }, this.sections()));
    fetch(`${window.routes.cart_add_url}`, config)
      .then((r) => r.json())
      .then((res) => {
        if (res.status) {
          this.toggle.checked = false;
        } else {
          this.render(res);
        }
        this.setBusy(false);
      })
      .catch(() => {
        this.toggle.checked = false;
        this.setBusy(false);
      });
  }

  remove() {
    // Find the maintenance line's key, then set its quantity to 0.
    fetch(`${window.routes.cart_url}.js`)
      .then((r) => r.json())
      .then((cart) => {
        const line = (cart.items || []).find((it) => String(it.variant_id) === String(this.variantId));
        const key = line ? line.key : this.variantId;
        const config = this.fetchConfigBase();
        config.body = JSON.stringify(Object.assign({ id: key, quantity: 0 }, this.sections()));
        return fetch(`${window.routes.cart_change_url}`, config).then((r) => r.json());
      })
      .then((res) => {
        this.render(res);
        this.setBusy(false);
      })
      .catch(() => {
        this.toggle.checked = true;
        this.setBusy(false);
      });
  }
}

if (!customElements.get('ces-cart-maintenance')) customElements.define('ces-cart-maintenance', CesCartMaintenance);
