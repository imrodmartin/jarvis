# Installation

## Requirements

- PHP `>= 8.3`
- Drupal `^11 || ^12`
- Docker and [ddev](https://ddev.com). ddev provides Composer and Drush inside the
  container, so the commands below assume it. Adapt them if you run Composer and
  Drush another way.
- Contrib modules, pulled automatically by Composer: `canvas`,
  `canvas_field_component`, `focal_point` (which pulls `crop`), and `twig_tweak`.

## Building a whole site

If you want a working site rather than the theme on its own, use the
[jarvis-bootstrap-recipe](https://github.com/imrodmartin/jarvis-bootstrap-recipe)
repository. It wires this theme into a full Drupal site (Canvas, demo content,
forms, workflow, SEO, AI) with one recipe apply, and includes this theme as a git
submodule.

The rest of this page installs the theme by itself.

## Require the theme

Register **both** repositories as Composer VCS sources, then require the theme.
The theme requires `imrodmartin/jarvis-modules` (the `jarvis_canvas` module):
several templates call Twig filters it provides, so the theme will neither
resolve nor install without it.

```bash
ddev composer config repositories.jarvis '{"type":"vcs","url":"https://github.com/imrodmartin/jarvis","no-api":true}'
ddev composer config repositories.jarvis-modules '{"type":"vcs","url":"https://github.com/imrodmartin/jarvis-modules","no-api":true}'
ddev composer require drupal/jarvis
```

`no-api` makes Composer clone over git instead of the GitHub API. It avoids the
unauthenticated 60-calls-per-hour API rate limit (and the occasional `502`) that
otherwise blocks the install.

Composer installs the theme to `web/themes/custom/jarvis` and downloads the
contrib modules to `web/modules/contrib`.

## Enable and apply the recipe

Run these in order:

Apply the recipe against a freshly installed site. It enables Canvas,
`canvas_field_component` and the Jarvis theme itself, then imports the config
and the demo content.

```bash
# Pass the recipe as an absolute container path. ddev drush resolves relative
# paths from the container working directory, not the project root.
ddev drush recipe /var/www/html/recipes/jarvis
ddev drush cache:rebuild   # also organises the Canvas component folders
```

!!! warning "Do not pre-install Canvas or the theme"
    Earlier versions of this page told you to run `pm:install canvas` plus
    `theme:install jarvis` plus `cache:rebuild` first. That breaks the install.
    The rebuild makes Canvas create its component entities and makes Drupal
    place the theme's blocks. A recipe refuses to import config that already
    exists and differs, so you get `The configuration '...' exists already and
    does not match the recipe's configuration`.

    The recipe lists both modules and the theme in its own `install:` list, so
    it creates everything in the right order on its own.

## What the recipe sets up

The authoritative list is the recipe's own
[README](https://github.com/imrodmartin/jarvis-bootstrap-recipe/blob/main/recipes/jarvis/README.md)
in the jarvis-bootstrap-recipe repository. In short, it:

- Installs Canvas, this theme, and the `jarvis_canvas` glue module, plus the
  supporting contrib and site-feature modules.
- Ships exported Canvas component config for all 21 SDCs, content templates for
  the **Blog** and **Basic** content types, page regions, and 5 reusable
  patterns.
- Imports base config: the `jarvis_hero_banner`, `wide`, and `portrait` image
  styles, the `focal_point` crop type, media types and fields, the
  `jarvis_html`/`jarvis_full_html` text formats, and theme settings.
- Imports demo content: 7 nodes, 2 Canvas pages (a component showcase and a
  Test Page), block content, media, and menu links — and sets the front page to
  the showcase (`/page/2`). Change it under **Configuration > Basic site
  settings** if you do not want it.

Because the component config is exported from this theme release, the content
templates and Canvas pages pin matching component versions. After bumping the
theme, re-export that config into the recipe.
