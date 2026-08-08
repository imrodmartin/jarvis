# Jarvis

DXPR-style SDC theme with Bootstrap 5, built for Drupal Canvas and Layout
Builder, with WCAG 2.2 AA safeguards built in (automatic overlay contrast,
safe-colour fallbacks, live contrast badges in the theme settings).

**Building a whole site?** Use the
[jarvis-bootstrap-recipe](https://github.com/imrodmartin/jarvis-bootstrap-recipe)
repository — it wires this theme into a fully functional Drupal site (Canvas,
demo content, forms, workflow, SEO, AI) with one recipe apply. This repo is
just the theme, included there as a git submodule.

**📘 [The Jarvis Handbook](docs/jarvis-guide.html) is the main documentation.**
It covers the whole theme in one document: what each part does, the steps to
build that part yourself, and a reference to all nineteen components with their
props, slots, and a worked example. Open it in a browser after cloning, or read
it on the [published docs site](https://project.pages.drupalcode.org/jarvis).

## Requirements

- PHP `>= 8.3`
- Drupal `^11 || ^12`
- Docker + [ddev](https://ddev.com) — provides Composer + Drush in-container (the commands below assume it)
- Contrib modules (pulled automatically by Composer): `canvas`, `canvas_field_component`, `focal_point` (→ `crop`), `twig_tweak`

## Install

Register this repo as a Composer VCS source, then require it:

```bash
ddev composer config repositories.jarvis '{"type":"vcs","url":"https://github.com/imrodmartin/jarvis","no-api":true}'
ddev composer require drupal/jarvis
```

`no-api` makes Composer clone over git instead of the GitHub API — it avoids the
unauthenticated 60-calls/hour API rate limit (and the occasional `502`) that
otherwise blocks the install.

Composer installs the theme to `web/themes/custom/jarvis` and downloads the
contrib modules to `web/modules/contrib`. Then run, **in this order**:

```bash
# Apply the recipe against a freshly installed site. It installs Canvas,
# canvas_field_component and this theme itself, then imports config and demo
# content. Pass an absolute container path — ddev drush resolves relative paths
# from the container working dir, not the project root. The recipe ships in the
# jarvis-bootstrap-recipe repo, not in this one, so this path assumes you are
# working in a checkout of that project.
ddev drush recipe /var/www/html/recipes/jarvis
ddev drush cache:rebuild   # also organises the Canvas component folders
```

> **Do not pre-install Canvas or the theme.** Earlier revisions of this file
> told you to run `pm:install canvas` + `theme:install jarvis` +
> `cache:rebuild` first. That now breaks the install: the rebuild makes Canvas
> auto-create component entities and makes Drupal auto-place the theme's
> blocks, and a recipe refuses to import config that already exists and
> differs — you get `The configuration '…' exists already and does not match
> the recipe's configuration`.
>
> The recipe lists both modules and the theme in its own `install:` list, so it
> creates all of that itself in the right order. Verified end to end against an
> empty database: 19/19 components enabled, blocks in their intended regions,
> 8 nodes and 2 Canvas pages rendering.

## What the recipe sets up

- Enables the remaining modules: `twig_tweak`, `focal_point` (→ `crop`),
  `media`, `media_library`, `image`, `menu_ui`, `menu_link_content`,
  `datetime`, `options`, `path`
- Sets Jarvis as the default theme and places its blocks in the correct
  regions (via config actions on the auto-created theme blocks)
- Sets the site front page to `/test-page` (the demo Canvas page) — change it
  under **Configuration → Basic site settings** after install if unwanted
- Imports base config: custom image styles (`jarvis_hero_banner`, `wide`, `portrait`), the
  `focal_point` crop type, `media` types + fields, and theme settings
- Creates the **Jarvis Sample** content type (fields, form/view displays, and
  a Canvas content template for its full view)
- Imports demo content: the **Test Blog** node, the **Test Page** Canvas page
  (`/test-page`) + its main-menu link, and all five media items

Canvas auto-discovers the theme's SDC components (card, hero, image, section,
etc.) on cache rebuild — they are not shipped as config, so the content
template and Canvas page pin the component versions of *this* theme release.

## License

GPL-2.0-or-later

### Bundled third-party assets

This theme bundles Bootstrap v5.3.8 under `libraries/bootstrap/`:

- Bootstrap — Copyright 2011-2025 The Bootstrap Authors, licensed under the
  [MIT License](https://github.com/twbs/bootstrap/blob/main/LICENSE), which is
  GPLv2-compatible. Source: https://getbootstrap.com/

No other third-party assets are bundled. Fonts are fetched from Google Fonts at
the site owner's request via the theme settings form and stored locally under
`public://jarvis-fonts/`; none ship with the theme.

## Documentation

Full documentation is under [`docs/`](docs/) and published at
https://project.pages.drupalcode.org/jarvis.

The main document is the handbook, [`docs/jarvis-guide.html`](docs/jarvis-guide.html).
Everything else in `docs/` is short reference material: installation,
configuration, and usage.

The handbook is also kept as two halves, for anyone who wants one without the
other. [`docs/training.html`](docs/training.html) is the explanation on its
own. [`TUTORIAL.md`](TUTORIAL.md) is the twelve step build on its own.
