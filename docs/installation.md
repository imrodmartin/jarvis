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

Register the theme's repository as a Composer VCS source, then require it:

```bash
ddev composer config repositories.jarvis '{"type":"vcs","url":"https://github.com/imrodmartin/jarvis","no-api":true}'
ddev composer require imrodmartin/jarvis
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

- Enables the remaining modules: `twig_tweak`, `focal_point` (with `crop`),
  `media`, `media_library`, `image`, `menu_ui`, `menu_link_content`, `datetime`,
  `options`, and `path`.
- Sets Jarvis as the default theme and places its blocks in the correct regions.
- Sets the front page to `/test-page`, the demo Canvas page. Change it under
  **Configuration > Basic site settings** if you do not want it.
- Imports base config: the `hero_banner`, `wide`, and `portrait` image styles, the
  `focal_point` crop type, media types and fields, and theme settings.
- Creates the **Jarvis Sample** content type with fields, form and view displays,
  and a Canvas content template for its full view.
- Imports demo content: the Test Blog node, the Test Page Canvas page
  (`/test-page`) with its main-menu link, and five media items.

Canvas auto-discovers the theme's components on cache rebuild. They are not shipped
as config, so the content template and the Canvas page pin the component versions
of this theme release.
