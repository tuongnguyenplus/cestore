# dongho

Shopify storefront theme.

## Base

Built on **[Dawn](https://github.com/Shopify/dawn) 16.0.0** (upstream commit `258f00f`).
All upstream Dawn files are kept untouched so the theme can be updated from
upstream without conflicts.

## Custom code (`ces-` prefix)

Everything custom to this store is prefixed `ces-` and lives alongside Dawn's files:

| Path                        | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `sections/ces-*.liquid`     | Custom sections (long-form PDP building blocks) |
| `snippets/ces-*.liquid`     | Shared snippets (marquee, accordion, checklist) |
| `assets/ces-*.css`          | Per-section stylesheets, loaded by that section |
| `assets/ces-*.js`           | Per-section Web Components, vanilla JS only     |
| `templates/product.*.json`  | Alternate product templates                     |

Rules for custom code:

- Never edit or overwrite an upstream Dawn file. If a Dawn section needs
  changes, copy it to `sections/ces-<name>.liquid` and edit the copy.
- Reuse Dawn's design tokens (`--color-foreground`, `--page-width`,
  `--font-heading-family`, …) instead of introducing a parallel design system.
- Scope CSS to `.ces-<section>__<element>` so it cannot collide with Dawn's.
- Load section CSS/JS from inside the section that needs it, never globally.

## Long-form product page

`templates/product.rovina.json` is an alternate product template that builds an
advertorial-style PDP out of the `ces-` sections. Assign it to a product from
the product admin's *Theme template* dropdown; every other product keeps using
Dawn's stock `product.json`.

Sections, in the order the template renders them:

| # | Section | Notes |
| - | ------- | ----- |
| 1 | `ces-announcement-marquee` | Infinite phrase ticker. Can also go in the Header group to sit above the header. |
| 2 | `ces-main-product` | Dawn's product section plus highlights, trust row, guarantee badge, shipping checklist, payment badges and an app slot. |
| 3 | `ces-accordion-content` | The long product copy as collapsible rows. |
| 4 | `ces-benefits-checklist` | Tick list, one column on mobile and two from 750px. |
| 5 | `ces-video-testimonial-row` | Vertical UGC clips, lazily loaded and muted-autoplayed in view. |
| 6 | `ces-feature-image-cards` | Image and copy cards. |
| 7 | `ces-icon-feature-grid` | Icon and heading grid with merchant-set columns. |
| 8 | `ces-image-text-banner` | Reusable banner with an optional badge strip. Used twice. |
| 9 | `ces-timeline-accordion` | Numbered week-by-week steps. |
| 10 | `ces-comparison-table` | Two claim columns, ticked and crossed. |
| 11 | `ces-bullet-cta` | Bullets plus a call to action. |
| 12 | `ces-testimonial-marquee` | Avatar band above a review carousel. |
| 13 | `ces-faq-accordion` | Questions and answers. |
| 14 | `ces-newsletter-signup` | Dawn's customer form with this section's layout. |

Shared snippets: `ces-marquee`, `ces-accordion-item`, `ces-checklist-item`,
`ces-icon`, `ces-section-padding`.

### The app slot

Pricing, subscription options and the sticky add-to-cart bar are **not** built
in the theme. `ces-main-product` has a `CES App slot` block that renders an
empty, correctly spaced `<div>` with a merchant-set id (`ces-app-price-slot` by
default) for an app to mount into. While the app has not rendered anything the
slot collapses to zero height, so it never leaves a gap in the layout.

Dawn's own `price`, `variant_picker`, `quantity_selector` and `buy_buttons`
blocks are untouched and still present in the template, so the page remains
functional before the app is installed.

### Content

Everything visible is a schema setting or a repeatable block — no copy, image or
item count is hard-coded in Liquid. The English placeholder text in the presets
and in `product.rovina.json` is there to be replaced.

## Local development

```sh
shopify theme dev
shopify theme check
```
