/*
 * ces-cart-upsell
 * Drives the "Special offers" upsell inside the cart drawer:
 *  - Add to cart from an offer card (AJAX), then re-render the drawer
 *  - Prev/next arrows scroll the horizontal offer track
 *
 * The whole <ces-cart-upsell> element is replaced each time the drawer
 * re-renders, so a fresh instance upgrades and re-binds on every render.
 */
class CesCartUpsell extends HTMLElement {
  connectedCallback() {
    this.cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');

    this.querySelectorAll('.cart-drawer__offer-add').forEach((btn) => {
      btn.addEventListener('click', this.onAdd.bind(this));
    });
    this.querySelectorAll('.cart-drawer__offers-nav').forEach((btn) => {
      btn.addEventListener('click', this.onNav.bind(this));
    });
  }

  get track() {
    return this.querySelector('.cart-drawer__offers-track');
  }

  onNav(evt) {
    const track = this.track;
    if (!track) return;
    const dir = evt.currentTarget.dataset.dir === 'next' ? 1 : -1;
    const card = this.querySelector('.cart-drawer__offer');
    const step = card ? card.getBoundingClientRect().width + 12 : 200;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  onAdd(evt) {
    const button = evt.currentTarget;
    const id = button.dataset.variantId;
    if (!id || button.classList.contains('loading')) return;

    button.classList.add('loading');
    button.setAttribute('aria-disabled', 'true');

    const config =
      typeof fetchConfig === 'function'
        ? fetchConfig('javascript')
        : { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/javascript' } };
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    const formData = new FormData();
    formData.append('id', id);
    formData.append('quantity', 1);

    if (this.cart && typeof this.cart.getSectionsToRender === 'function') {
      formData.append(
        'sections',
        this.cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append('sections_url', window.location.pathname);
      if (typeof this.cart.setActiveElement === 'function') {
        this.cart.setActiveElement(document.activeElement);
      }
    }
    config.body = formData;

    fetch(`${window.routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          this.reset(button);
          return;
        }
        if (this.cart && typeof this.cart.renderContents === 'function') {
          if (this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          this.cart.renderContents(response);
          if (typeof this.cart.open === 'function' && !this.cart.classList.contains('active')) {
            this.cart.open();
          }
        } else {
          window.location = window.routes.cart_url;
        }
      })
      .catch(() => this.reset(button));
  }

  reset(button) {
    button.classList.remove('loading');
    button.removeAttribute('aria-disabled');
  }
}

if (!customElements.get('ces-cart-upsell')) {
  customElements.define('ces-cart-upsell', CesCartUpsell);
}
