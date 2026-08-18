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

## Local development

```sh
shopify theme dev
shopify theme check
```
