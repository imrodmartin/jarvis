# Building the Jarvis Theme — A Beginner's Tutorial

This is a complete, step-by-step guide to building **Jarvis** from an empty folder: a
DXPR-style Drupal 11 theme with Bootstrap 5, a set of **Single Directory Components
(SDC)**, full **Drupal Canvas** integration, colour + font theme settings, and a
**recipe** that installs everything with one command.

It assumes you have never built a Drupal theme before. Every file is explained. By the
end you'll understand *why* each piece exists, not just *what* to type.

---

## Table of contents

1. [What we're building (the big picture)](#1-what-were-building)
2. [Key concepts, in plain English](#2-key-concepts)
3. [Prerequisites & site setup](#3-prerequisites)
4. [Step 1 — Scaffold the theme](#step-1-scaffold-the-theme)
5. [Step 2 — Add Bootstrap and the CSS layer](#step-2-bootstrap-and-css)
6. [Step 3 — The page template (regions & layout)](#step-3-page-template)
7. [Step 4 — Your first Single Directory Component](#step-4-first-sdc)
8. [Step 5 — Components with slots (Section & Columns)](#step-5-slots)
9. [Step 6 — A component with an image (Hero)](#step-6-hero)
10. [Step 7 — Colour settings](#step-7-colours)
11. [Step 8 — Font settings (self-hosted Google Fonts)](#step-8-fonts)
12. [Step 9 — Wiring the theme into Drupal Canvas](#step-9-canvas)
13. [Step 10 — Content templates (fielded nodes → components)](#step-10-content-templates)
14. [Step 11 — Package it all as a recipe](#step-11-recipe)
15. [Step 12 — Install, apply, and test](#step-12-install)
16. [Troubleshooting & cheat sheet](#troubleshooting)

---

<a name="1-what-were-building"></a>
## 1. What we're building

Jarvis is a **base theme + component kit**. It gives a site builder:

- A responsive page shell (header, nav, hero, sidebars, footer) built on Bootstrap 5.
- A palette of drag-and-drop **components** (Hero, Card, Section, Text, Image, Video,
  1/2/3-column layouts) that non-developers place visually in **Canvas**.
- A theme settings screen where an admin picks brand **colours** and **fonts** with no
  code.
- A **recipe** so the whole thing — theme, modules, demo content — installs in one step.

Final folder layout:

```
web/themes/custom/jarvis/
├── jarvis.info.yml          # tells Drupal "I am a theme", declares regions
├── jarvis.libraries.yml     # declares CSS/JS bundles
├── jarvis.theme             # PHP: preprocess hooks (colours, fonts output)
├── theme-settings.php       # PHP: the admin settings form (colour + font pickers)
├── logo.svg
├── templates/
│   └── page.html.twig       # the page shell / region layout
├── css/
│   ├── overrides.css        # Bootstrap variable overrides + spacing utilities
│   ├── color-settings.css   # styles for the settings form
│   └── font-settings.css
├── js/
│   ├── color-settings.js    # settings-form behaviour
│   └── font-settings.js
├── libraries/bootstrap/     # vendored Bootstrap 5 CSS + JS
├── components/              # ← the Single Directory Components
│   ├── hero/  card/  section/  text/  image/  video/
│   ├── one-column/ two-column/ three-column/
│   └── (each has .component.yml + .twig + optional .css/.js)
├── google-fonts.json        # font catalogue for the settings dropdown
└── recipe/                  # the installer (config + demo content)
    ├── recipe.yml
    ├── config/
    └── content/
```

---

<a name="2-key-concepts"></a>
## 2. Key concepts, in plain English

| Term | What it means for this tutorial |
|------|--------------------------------|
| **Theme** | The folder that controls how your site *looks*. Jarvis is a *base theme* extending Drupal's `stable9`. |
| **Region** | A named drop-zone in the page (Header, Footer, Content…). Blocks and menus get placed into regions. |
| **Twig** | Drupal's templating language (`{{ variable }}`, `{% if %}`). HTML with holes you fill in. |
| **Library** | A named bundle of CSS + JS. Drupal only loads a library when something asks for it. |
| **SDC (Single Directory Component)** | A self-contained UI widget living in one folder: a `*.component.yml` (its "form"/schema) plus a `*.twig` (its HTML), and optional CSS/JS. Drupal core auto-discovers them. |
| **Props & Slots** | A component's inputs. **Props** are simple values (text, a number, a colour). **Slots** are *areas you drop other components into* (like a column that holds cards). |
| **Drupal Canvas** | A visual, drag-and-drop page builder (the successor experience to Layout Builder). It reads your SDC components and lets site builders arrange them on a canvas. |
| **Content template** | A saved Canvas layout for a *content type* — e.g. "every Article renders its hero field as a Hero component, then its body as Text." |
| **Recipe** | A YAML-based installer. It turns on modules, imports config, and loads demo content in one command. Replaces the old "install profile / features" dance. |

**The mental model:** you build *components* once (developer job), then a *site builder*
composes pages out of them in Canvas (no code). The theme settings let an admin
re-skin the whole thing (colours/fonts) without touching CSS.

---

<a name="3-prerequisites"></a>
## 3. Prerequisites & site setup

You need a working Drupal 11 site. This project uses **DDEV** (Docker-based local dev).

```bash
# From an empty project folder:
ddev config --project-type=drupal --docroot=web
ddev start
ddev composer create drupal/recommended-project:^11
ddev composer require drush/drush
ddev drush site:install --account-name=admin --account-pass=admin -y
ddev launch          # opens the site in your browser
```

Jarvis relies on **Drupal Canvas** and a few contrib modules. Install them now so they're
available while you build:

```bash
ddev composer require drupal/canvas drupal/focal_point drupal/twig_tweak
```

> **Note on Canvas:** Canvas is the drag-and-drop builder. Its machine name is `canvas`,
> and it ships a companion `canvas_field_component`. You *can* build and preview all the
> SDC components without Canvas — they also work in Layout Builder — but the Canvas page
> regions and content templates in Step 9–10 require it.

Your theme goes in `web/themes/custom/jarvis/`. Create that folder:

```bash
mkdir -p web/themes/custom/jarvis
cd web/themes/custom/jarvis
```

Everything below is created inside that folder.

---

<a name="step-1-scaffold-the-theme"></a>
## Step 1 — Scaffold the theme

### 1a. `jarvis.info.yml` — the theme's identity card

Every theme needs a `*.info.yml`. The filename's prefix (`jarvis`) is the theme's
**machine name** and must match the folder name.

```yaml
name: Jarvis
type: theme
base theme: stable9
core_version_requirement: ^11 || ^12
description: 'DXPR-style SDC theme with Bootstrap 5, built for Drupal Canvas and Layout Builder.'
package: Custom
libraries:
  - jarvis/global
regions:
  header: Header
  primary_menu: 'Primary menu'
  breadcrumb: Breadcrumb
  page_title: 'Page title'
  hero: Hero
  highlighted: Highlighted
  content_top: 'Content top'
  sidebar_left: 'Left sidebar'
  content: Content
  sidebar_right: 'Right sidebar'
  content_bottom: 'Content bottom'
  footer: Footer
```

Line by line:

- **`base theme: stable9`** — we inherit Drupal's clean, markup-light base theme rather
  than starting from zero. We get sensible core templates for free and override only what
  we care about.
- **`core_version_requirement`** — works on Drupal 11 and 12.
- **`libraries: - jarvis/global`** — load the `global` library (defined next) on *every*
  page. That's how Bootstrap gets onto the page.
- **`regions:`** — the list of drop-zones. The **key** (`header`) is the machine name your
  Twig uses (`page.header`); the **value** (`Header`) is the human label shown on the
  Block layout admin screen. These region names must line up with your `page.html.twig`
  (Step 3).

### 1b. `jarvis.libraries.yml` — declaring CSS/JS

A **library** is a named bundle. Drupal loads it only when referenced.

```yaml
global:
  version: 1.x
  css:
    base:
      libraries/bootstrap/css/bootstrap.min.css: { minified: true }
      css/overrides.css: {}
  js:
    libraries/bootstrap/js/bootstrap.bundle.min.js: { minified: true, attributes: { defer: true } }

color-settings:
  version: 1.x
  css:
    theme:
      css/color-settings.css: {}
  js:
    js/color-settings.js: {}
  dependencies:
    - core/once
    - core/drupal

font-settings:
  version: 1.x
  css:
    theme:
      css/font-settings.css: {}
  js:
    js/font-settings.js: {}
  dependencies:
    - core/once
    - core/drupal
    - core/drupalSettings
```

- **`global`** is attached in `info.yml`, so it's everywhere. It loads Bootstrap's CSS/JS
  plus our `overrides.css`.
- **`css` groups** (`base`, `theme`…) control load order/weight. `base` loads before
  `theme`, so component CSS can win over Bootstrap.
- **`color-settings`** / **`font-settings`** are *only* attached to the theme settings
  admin form (Step 7–8), never on the front end. `dependencies` pull in Drupal's JS
  helpers (`once`, `Drupal.behaviors`, `drupalSettings`).

### 1c. A logo and an empty theme file

- Drop a `logo.svg` in the theme root.
- Create an (initially near-empty) `jarvis.theme` — a PHP file for hooks. We fill it in
  Steps 7–8:

```php
<?php

/**
 * @file
 * Jarvis theme hooks.
 */
```

> **Clear the cache after any `.yml` change.** Drupal caches discovery aggressively:
> `ddev drush cr`. Get in the habit — 90% of "my change didn't show up" is a stale cache.

Now enable the theme so you can see progress:

```bash
ddev drush theme:enable jarvis
ddev drush config:set system.theme default jarvis -y
ddev drush cr
```

---

<a name="step-2-bootstrap-and-css"></a>
## Step 2 — Add Bootstrap and the CSS layer

### 2a. Vendor Bootstrap

Download Bootstrap 5's compiled dist and place two files:

```
libraries/bootstrap/css/bootstrap.min.css
libraries/bootstrap/js/bootstrap.bundle.min.js
```

(You can grab these from getbootstrap.com → "Download" → `dist/` folder. The `.bundle`
JS includes Popper, which the responsive nav needs.)

### 2b. `css/overrides.css` — theme by *variables*, not by rewriting

Bootstrap 5 is built on **CSS custom properties** (`--bs-primary`, etc.). Instead of
forking Bootstrap's SCSS, we just override its variables. This is the whole styling
philosophy of Jarvis — *theme at the variable level.*

```css
/**
 * Jarvis theme overrides — DXPR-style look via Bootstrap 5 CSS custom properties.
 */
:root {
  --bs-primary: #2d6cdf;
  --bs-primary-rgb: 45, 108, 223;
  --bs-secondary: #1b2a4a;
  --bs-body-font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --bs-body-color: #1b2130;
  --bs-border-radius: 0.65rem;
  --bs-border-radius-lg: 1rem;
  --jarvis-section-gap: 4rem;
}

.btn-primary {
  --bs-btn-bg: var(--bs-primary);
  --bs-btn-border-color: var(--bs-primary);
  --bs-btn-hover-bg: #245ac0;
  --bs-btn-hover-border-color: #245ac0;
  --bs-btn-padding-x: 1.6rem;
  --bs-btn-padding-y: 0.7rem;
  font-weight: 600;
}
```

Because Jarvis is a **Canvas SDC theme**, avoid viewport units (`vh`/`vw`) — they break the
Canvas preview iframe, which has no real viewport. Stick to `rem`/`px`/`%`.

### 2c. Spacing utilities every component shares

The design calls for exact `10 / 20 / 30px` spacing, which Bootstrap's `rem` scale can't
hit. So Jarvis ships its own tiny utility set (prefix `jp-` = "Jarvis padding"). Every
component's `padding` / `margin` props compile down to these classes:

```css
/* small=10px, medium=20px, large=30px */
.jp-p-all-small { padding: 10px; }
.jp-p-all-medium { padding: 20px; }
.jp-p-all-large { padding: 30px; }
.jp-p-top-small { padding-top: 10px; }
/* …top/bottom/left/right × small/medium/large, for padding (jp-p-) and margin (jp-m-) … */

.jp-vpad { padding-top: 30px; padding-bottom: 30px; }
.jp-nopad { padding-top: 0 !important; padding-bottom: 0 !important; }
```

The naming pattern is deliberate: `jp-{p|m}-{side}-{size}`. In Step 4 you'll see the Twig
that builds these class names from a component's props — write the pattern once, reuse it
in every component.

---

<a name="step-3-page-template"></a>
## Step 3 — The page template (regions & layout)

`templates/page.html.twig` is the shell that wraps every page. It decides which regions are
**full-width** (span the browser) vs **boxed** (centred `.container` with side margins),
and how sidebars behave.

Create `templates/page.html.twig`:

```twig
<div class="layout-container">

  {# Full-width header #}
  {% if page.header %}
    <header role="banner" class="jarvis-region jarvis-region--full jarvis-header">
      {{ page.header }}
    </header>
  {% endif %}

  {# Boxed nav row: branding left, menu right, responsive offcanvas on mobile #}
  {% if page.primary_menu %}
    <div class="container jarvis-region jarvis-primary-menu d-flex align-items-center">
      <div class="jarvis-branding-wrap">
        {{ page.primary_menu.jarvis_site_branding }}
      </div>
      <button class="jarvis-menu-toggle d-lg-none ms-auto" type="button"
              data-bs-toggle="offcanvas" data-bs-target="#jarvis-primary-nav"
              aria-controls="jarvis-primary-nav" aria-label="{{ 'Toggle main menu'|t }}">
        <span class="jarvis-menu-toggle__bar"></span>
      </button>
      <div class="offcanvas-lg offcanvas-end jarvis-primary-nav" tabindex="-1"
           id="jarvis-primary-nav" aria-label="{{ 'Main menu'|t }}">
        <div class="offcanvas-header d-lg-none">
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas"
                  data-bs-target="#jarvis-primary-nav" aria-label="{{ 'Close'|t }}"></button>
        </div>
        <div class="offcanvas-body">
          {{ page.primary_menu.jarvis_main_menu }}
          {{ page.primary_menu|without('jarvis_site_branding', 'jarvis_main_menu') }}
        </div>
      </div>
    </div>
  {% endif %}

  {# Boxed breadcrumb #}
  {% if page.breadcrumb %}
    <div class="container jarvis-region jarvis-breadcrumb">{{ page.breadcrumb }}</div>
  {% endif %}

  {# Full-width page title — hidden on the front page #}
  {% if page.page_title and not is_front %}
    <div class="jarvis-region jarvis-region--full jarvis-page-title">{{ page.page_title }}</div>
  {% endif %}

  {% if page.hero %}
    <div class="jarvis-region jarvis-region--full jarvis-hero">{{ page.hero }}</div>
  {% endif %}

  {% if page.highlighted %}
    <div class="container jarvis-region jarvis-highlighted">{{ page.highlighted }}</div>
  {% endif %}

  <main role="main">
    <a id="main-content" tabindex="-1"></a>

    {% if page.content_top %}
      <div class="container jarvis-region jarvis-content-top">{{ page.content_top }}</div>
    {% endif %}

    {# A region array is truthy even when empty (it carries cache metadata), so
       render sidebars to a string and test the trimmed output. #}
    {% set sidebar_left = page.sidebar_left|render|trim %}
    {% set sidebar_right = page.sidebar_right|render|trim %}
    {% set has_sidebar = sidebar_left or sidebar_right %}
    {% if has_sidebar %}
      <div class="container jarvis-region jarvis-main">
        <div class="row g-4">
          {% if sidebar_left %}
            <aside class="col-12 col-lg-3 jarvis-sidebar jarvis-sidebar--left" role="complementary">
              {{ sidebar_left|raw }}
            </aside>
          {% endif %}
          <div class="col jarvis-content">
            {{ page.content }}
          </div>
          {% if sidebar_right %}
            <aside class="col-12 col-lg-3 jarvis-sidebar jarvis-sidebar--right" role="complementary">
              {{ sidebar_right|raw }}
            </aside>
          {% endif %}
        </div>
      </div>
    {% else %}
      {# No sidebars: edge-to-edge so Canvas full-width columns can break out. #}
      <div class="jarvis-content jarvis-content--full">
        {{ page.content }}
      </div>
    {% endif %}

    {% if page.content_bottom %}
      <div class="container jarvis-region jarvis-content-bottom">{{ page.content_bottom }}</div>
    {% endif %}
  </main>

  {% if page.footer %}
    <footer role="contentinfo" class="jarvis-region jarvis-region--full jarvis-footer">
      {{ page.footer }}
    </footer>
  {% endif %}

</div>
```

The three ideas a beginner should take away:

1. **`{{ page.REGION }}`** prints a region. The region names match `info.yml` exactly.
2. **Full-width vs boxed** is just: wrap in `.container` (boxed) or don't (full-width).
3. **Two clever bits worth understanding:**
   - `{{ page.primary_menu.jarvis_site_branding }}` renders *one specific block* out of a
     region by its block ID, so we can split the logo out of the mobile menu drawer. (Those
     block IDs come from the recipe in Step 11.)
   - A Drupal region is "truthy" even when it holds no blocks (it carries cache metadata),
     so to know whether a sidebar is *really* empty we render it to a string and `trim` it.
     When both sidebars are empty the content goes edge-to-edge, which lets a Canvas
     full-width column layout break out of the centred column.

`ddev drush cr` and reload — you now have a themed page shell.

---

<a name="step-4-first-sdc"></a>
## Step 4 — Your first Single Directory Component

Now the fun part. An SDC lives in `components/<name>/` and needs at minimum two files:

- `<name>.component.yml` — the **schema**: its name, category, and the **props** (inputs).
- `<name>.twig` — the **HTML**, which receives those props as variables.

Drupal core discovers any component under `components/` automatically. No registration,
no hook. Clear cache and it appears (including inside Canvas's component list).

Let's build the **Text** component — a rich-text block with width and alignment controls.

### 4a. `components/text/text.component.yml`

```yaml
$schema: https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json
name: Text
status: stable
description: 'Rich text block with width and alignment controls.'
category: Jarvis
props:
  type: object
  required:
    - body
  properties:
    body:
      title: Body
      type: string
      contentMediaType: text/html
      'x-formatting-context': block
      examples:
        - '<h2>Section heading</h2><p>Body copy with <strong>rich text</strong>.</p>'
    width:
      title: Width
      type: string
      enum: [narrow, normal, wide]
      'meta:enum':
        narrow: Narrow
        normal: Normal
        wide: Wide
      default: normal
    align:
      title: Alignment
      type: string
      enum: [start, center, end]
      'meta:enum':
        start: Left
        center: Center
        end: Right
      default: start
    padding:
      title: Padding
      type: string
      enum: [none, all, top, bottom, left, right]
      'meta:enum': { none: None, all: 'All sides', top: Top, bottom: Bottom, left: Left, right: Right }
      default: none
    padding_size:
      title: 'Padding size'
      type: string
      enum: [small, medium, large]
      'meta:enum': { small: 'Small (10px)', medium: 'Medium (20px)', large: 'Large (30px)' }
      default: medium
    vertical_padding:
      title: 'Vertical padding (30px)'
      type: boolean
      default: false
```

How to read the schema — this is the most important thing in the whole tutorial:

- **`$schema`** points at Drupal's SDC metadata schema. It gives you editor validation and
  is required for the component to be "recognised."
- **`name` / `category`** show up in Canvas's component picker. Everything with
  `category: Jarvis` groups together in the sidebar.
- **`status: stable`** marks it production-ready (vs `experimental`/`deprecated`).
- **`props.properties`** — each entry is one input the site builder fills in:
  - **`type`** is a JSON-Schema type (`string`, `integer`, `boolean`, `object`).
  - **`title`** is the field label in Canvas.
  - **`enum` + `meta:enum`** turns a string into a **dropdown**: `enum` is the stored
    values, `meta:enum` is the friendly labels. This is how you give a builder a
    "Left / Center / Right" picker.
  - **`default`** is the value used when the builder leaves it alone.
  - **`contentMediaType: text/html`** + **`x-formatting-context: block`** tells Canvas
    "this is a rich-text/WYSIWYG field," not a plain string.
  - **`required`** (top-level list) marks props that *must* have a value. **This matters
    for Canvas data binding:** a required SDC prop can be bound to a content field, but
    only if that field is itself required. If a prop won't show the 🔗 "link to field"
    icon in Canvas, it's usually because the prop is required but the target field isn't.

### 4b. `components/text/text.twig`

The Twig receives every prop as a top-level variable of the same name.

```twig
{#
/**
 * @file
 * Jarvis text block SDC.
 */
#}
{% import '@jarvis/jarvis-spacing.html.twig' as jarvis %}
{% set space = jarvis.classes(padding|default('none'), padding_size|default('medium'),
  margin|default('none'), margin_size|default('medium'),
  vertical_padding|default(false), no_padding|default(false)) %}
{% set width_class = { narrow: 'col-lg-6', normal: 'col-lg-8', wide: 'col-lg-10' }[width|default('normal')] %}
{% set align_class = { start: 'text-start', center: 'text-center', end: 'text-end' }[align|default('start')] %}

<div class="jarvis-text {{ space }}">
  <div class="container">
    <div class="row justify-content-center">
      <div class="{{ width_class }} {{ align_class }}">
        {{ body|raw }}
      </div>
    </div>
  </div>
</div>
```

Notice the **spacing pattern** (`space`): it stitches the `padding` + `padding_size` props
into a `jp-p-all-medium`-style class from Step 2c. **Every** Jarvis component reuses this
logic. It lives once as a Twig macro in `templates/jarvis-spacing.html.twig` (Drupal
exposes each theme's `templates/` dir under the `@jarvis` namespace), and every component
imports it — one source of truth is what makes the whole kit feel uniform.

`{{ body|raw }}` prints the HTML without escaping (safe here because Canvas ran it through
a text-format filter first).

### 4c. See it

```bash
ddev drush cr
```

Every component's `examples:` values feed the SDC preview, so fill them in — they're your
free "Storybook." Or just drop the component into a Canvas page (Step 9).

You've now built a complete component. **Card, Image, and Video follow the exact same
recipe** — a `.component.yml` describing props, a `.twig` rendering them, plus a `.css` for
component-specific styling. Copy Text, change the props, change the markup.

---

<a name="step-5-slots"></a>
## Step 5 — Components with slots (Section & Columns)

Props are *values*. **Slots** are *areas that hold other components*. A slot is how you
build a column layout: the builder drops a Card *into* the left column of a 2-column
component.

### 5a. Section — a single-slot wrapper

`components/section/section.component.yml` (trimmed to essentials):

```yaml
$schema: https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json
name: Section
status: stable
description: 'Container/section wrapper that holds other components in its slot.'
category: Jarvis
props:
  type: object
  properties:
    width:
      title: Width
      type: string
      enum: [normal, full]
      'meta:enum': { normal: 'Contained', full: 'Full width' }
      default: normal
    bg:
      title: Background
      type: string
      enum: [none, light, dark, primary, body-tertiary]
      'meta:enum': { none: None, light: Light, dark: Dark, primary: Primary, body-tertiary: 'Subtle grey' }
      default: none
    # …padding / margin / vertical_padding props, same as Text…
slots:
  content:
    title: Content
    description: 'Components placed inside this section.'
```

The new part is the top-level **`slots:`** key. `content` is a named drop-zone. In the
Twig, a slot prints just like a variable:

```twig
{% set container = (width|default('normal')) == 'full' ? 'container-fluid' : 'container' %}
{% set bg_class = bg != 'none' ? 'bg-' ~ bg : '' %}
<section class="jarvis-section {{ bg_class }}">
  <div class="{{ container }}">
    {{ content }}   {# ← whatever the builder dropped into the slot renders here #}
  </div>
</section>
```

### 5b. Two-column — a multi-slot layout

`components/two-column/two-column.component.yml` declares **two** slots and layout props:

```yaml
name: '2 Columns'
category: 'Jarvis Layout'
props:
  type: object
  properties:
    width:
      title: 'Section width'
      type: string
      enum: [boxed, full]
      'meta:enum': { boxed: 'Boxed (centred)', full: 'Full width' }
      default: boxed
    gap:
      title: 'Column gap'
      type: string
      enum: [none, small, normal, large]
      'meta:enum': { none: None, small: Small, normal: Normal, large: Large }
      default: normal
    ratio:
      title: 'Column ratio'
      type: string
      enum: [even, wide-left, wide-right]
      'meta:enum': { even: 'Even (1:1)', wide-left: 'Wide left (2:1)', wide-right: 'Wide right (1:2)' }
      default: even
    # …padding / margin props…
slots:
  first:
    title: 'Column 1'
    description: 'Left / top column.'
  second:
    title: 'Column 2'
    description: 'Right / bottom column.'
```

And the Twig maps the `ratio`/`gap` props onto Bootstrap's grid classes:

```twig
{% set gap_class = { none: 'g-0', small: 'g-2', normal: 'g-4', large: 'g-5' }[gap|default('normal')] %}
{% set cols = {
  even:         ['col-12 col-md-6', 'col-12 col-md-6'],
  'wide-left':  ['col-12 col-md-8', 'col-12 col-md-4'],
  'wide-right': ['col-12 col-md-4', 'col-12 col-md-8'],
}[ratio|default('even')] %}
{% set container = (width|default('boxed')) == 'full' ? 'container-fluid' : 'container' %}
<div class="jarvis-columns jarvis-columns--2">
  <div class="{{ container }}">
    <div class="row {{ gap_class }}">
      <div class="{{ cols[0] }}">{{ first }}</div>
      <div class="{{ cols[1] }}">{{ second }}</div>
    </div>
  </div>
</div>
```

`col-12` on mobile means each column is full width and they **stack**; `col-md-*` kicks in
at ≥768px and puts them **side by side**. That single line is your entire responsive story.
`one-column` and `three-column` are the same idea with one / three slots.

---

<a name="step-6-hero"></a>
## Step 6 — A component with an image (Hero)

The Hero shows how Canvas passes an **image** into a component. The magic is one line in
the schema:

```yaml
image:
  title: 'Background image'
  $ref: json-schema-definitions://canvas.module/image
```

**`$ref: json-schema-definitions://canvas.module/image`** is a Canvas-provided prop type.
It gives the builder a proper media/image picker, and inside Twig the `image` prop arrives
as an object with `image.src`, `image.alt`, `image.width`, `image.height`. You don't build
an upload widget — Canvas hands you the resolved values.

`components/hero/hero.component.yml` (key props):

```yaml
name: Hero
category: Jarvis
props:
  type: object
  required:
    - heading
  properties:
    heading:      { title: Heading, type: string }
    subheading:   { title: Subheading, type: string }
    cta_text:     { title: 'CTA text', type: string }
    cta_href:     { title: 'CTA link', type: string, format: uri-reference }
    image:        { title: 'Background image', $ref: 'json-schema-definitions://canvas.module/image' }
    overlay:      { title: 'Overlay opacity (%)', type: integer, default: 40 }
    align:
      title: 'Text alignment'
      type: string
      enum: [start, center, end]
      'meta:enum': { start: Left, center: Center, end: Right }
      default: center
    text_color:
      title: 'Text color'
      type: string
      enum: [light, dark]
      'meta:enum': { light: 'Light (#ffffff)', dark: 'Dark (#2d6cdf)' }
      default: light
    # …padding / margin / vertical_padding…
```

`components/hero/hero.twig` consumes the image object:

```twig
{% set align_class = { start: 'text-start', center: 'text-center', end: 'text-end' }[align|default('center')] %}
{% set justify_class = { start: 'justify-content-start', center: 'justify-content-center', end: 'justify-content-end' }[align|default('center')] %}
{% set has_image = image.src is defined and image.src %}
{% set overlay = overlay|default(40) %}
{% set text_color = text_color|default('light') %}

<section class="jarvis-hero jarvis-hero--text-{{ text_color }} position-relative d-flex align-items-center {{ align_class }}"
         {% if has_image %}style="background-image: url('{{ image.src }}');"{% endif %}>
  {% if has_image %}
    <div class="jarvis-hero__overlay" style="opacity: {{ overlay / 100 }};" aria-hidden="true"></div>
  {% endif %}
  <div class="container position-relative jarvis-hero__inner py-5">
    <div class="row {{ justify_class }}">
      <div class="col-lg-9 col-xl-8">
        {% if heading %}<h1 class="jarvis-hero__heading display-3 fw-bold mb-3">{{ heading }}</h1>{% endif %}
        {% if subheading %}<p class="jarvis-hero__subheading lead mb-4">{{ subheading }}</p>{% endif %}
        {% if cta_text and cta_href %}<a href="{{ cta_href }}" class="btn btn-primary btn-lg">{{ cta_text }}</a>{% endif %}
      </div>
    </div>
  </div>
</section>
```

Optional polish: a small script can measure the background and *raise* the overlay
opacity when white text would fail WCAG AA contrast — the builder sets a floor, the JS
enforces legibility. In Jarvis that engine is shared by the hero and card components:
it lives in `js/contrast.js`, registered as the `jarvis/contrast` library and attached
to each component through `libraryOverrides: dependencies:` in its `*.component.yml`
(the alternative — SDC auto-loading a same-named JS file per component — would mean
duplicating the code).

### Image styles inside components

For the `Image` component, note the `image_uri` prop and the **named image style** trick.
Canvas gives you `image.src`, but to render a specific Drupal **image style** (say
`hero_banner`) you also pass the raw file URI and let Twig build the derivative with
`twig_tweak`'s `|image_style` filter. That's why the recipe installs `twig_tweak`, and why
image styles like `hero_banner` and `wide` are shipped as config (Step 11). In a content
template, use `|image_style` in the SDC — **don't** try to use a Canvas "adapter" for it
(adapters are not allowed inside content templates).

---

<a name="step-7-colours"></a>
## Step 7 — Colour settings

Goal: an admin picks brand colours on the theme settings page, and the whole site re-skins
— no CSS edits. The trick: **write the chosen colours out as CSS custom properties**, and
have `overrides.css` consume those properties.

Three moving parts:

1. A **shared list** of colour slots (so the form and the output never drift).
2. A **settings form** (`theme-settings.php`) with a hex field + native colour picker.
3. A **preprocess hook** (`jarvis.theme`) that prints the chosen colours as an inline
   `<style>`.

### 7a. The shared colour map (`jarvis.theme`)

```php
/**
 * setting key => [label, CSS custom property, needs -rgb, default].
 */
function _jarvis_colors() {
  return [
    'jarvis_color_primary'     => ['Primary', '--bs-primary', TRUE, '#2d6cdf'],
    'jarvis_color_secondary'   => ['Secondary', '--bs-secondary', FALSE, '#1b2a4a'],
    'jarvis_color_title_bg'    => ['Title background', '--jarvis-title-bg', FALSE, ''],
    'jarvis_color_title_text'  => ['Title text', '--jarvis-title-color', FALSE, ''],
    'jarvis_color_footer_bg'   => ['Footer background', '--jarvis-footer-bg', FALSE, ''],
    'jarvis_color_footer_text' => ['Footer text', '--jarvis-footer-color', FALSE, ''],
    'jarvis_color_heading'     => ['Heading color', '--jarvis-heading-color', FALSE, ''],
    'jarvis_color_header_bg'   => ['Header block region background', '--jarvis-header-bg', FALSE, ''],
    'jarvis_color_header_text' => ['Header block region text', '--jarvis-header-color', FALSE, ''],
    'jarvis_color_header_link' => ['Header block region link color', '--jarvis-header-link-color', FALSE, ''],
  ];
}
```

One function, used by both the form and the output — that's what keeps them in sync. The
third element (`TRUE`) means "also emit an `-rgb` triplet," which Bootstrap needs for
`rgba()` transparency (`--bs-primary-rgb`).

### 7b. The settings form (`theme-settings.php`)

Drupal automatically calls `hook_form_system_theme_settings_alter()` in a theme's
`theme-settings.php` to add fields to the appearance settings page.

```php
<?php

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Markup;

function jarvis_form_system_theme_settings_alter(array &$form, FormStateInterface $form_state) {
  $form['jarvis_colors'] = [
    '#type' => 'details',
    '#title' => t('Colors'),
    '#open' => TRUE,
    '#weight' => -20,
  ];

  foreach (_jarvis_colors() as $key => $info) {
    [$label, , , $default] = $info;
    $val = theme_get_setting($key);
    $val = (is_string($val) && $val !== '') ? $val : $default;
    $swatch = ($val !== '') ? $val : '#ffffff';

    $form['jarvis_colors'][$key] = [
      '#type' => 'textfield',
      '#title' => t($label),
      '#default_value' => $val,
      '#size' => 10,
      '#maxlength' => 7,
      '#attributes' => [
        'class' => ['jarvis-color-hex'],
        'pattern' => '#[0-9a-fA-F]{6}',
        'placeholder' => '#ffffff',
      ],
      // A native colour picker as the field prefix; JS keeps it in sync with the text field.
      '#field_prefix' => Markup::create(
        '<input type="color" class="jarvis-color-pick" value="'
        . htmlspecialchars($swatch, ENT_QUOTES) . '">'
      ),
    ];
  }

  $form['#attached']['library'][] = 'jarvis/color-settings';
  $form['#validate'][] = 'jarvis_color_settings_validate';
}

/**
 * Reject anything that isn't a #rrggbb hex (or empty). Security: this is what
 * stops someone injecting CSS through a colour value.
 */
function jarvis_color_settings_validate(array &$form, FormStateInterface $form_state) {
  foreach (array_keys(_jarvis_colors()) as $key) {
    $val = (string) $form_state->getValue($key);
    if ($val !== '' && !preg_match('/^#[0-9a-fA-F]{6}$/', $val)) {
      $form_state->setErrorByName($key, t('%v is not a valid hex color (use #rrggbb).', ['%v' => $val]));
    }
  }
}
```

Each colour is a hex **textfield** with a native `<input type="color">` glued on as the
prefix. The colour input is just the picker/preview; only the text field actually submits.
`css/color-settings.js` keeps the two in sync. **Always validate** — the strict hex regex
is what prevents CSS injection through a settings value.

### 7c. Output the colours (`jarvis.theme` preprocess)

```php
/**
 * Implements hook_preprocess_html().
 * Emit chosen colours as CSS variables in an inline <style>.
 */
function jarvis_preprocess_html(array &$variables) {
  $lines = [];
  foreach (_jarvis_colors() as $key => $info) {
    [$label, $var, $rgb] = $info;
    $val = theme_get_setting($key);
    // Re-validate on output too — only emit clean #rrggbb values.
    if (!is_string($val) || !preg_match('/^#[0-9a-fA-F]{6}$/', $val)) {
      continue;
    }
    $lines[] = "$var:$val;";
    if ($rgb) {
      $r = hexdec(substr($val, 1, 2));
      $g = hexdec(substr($val, 3, 2));
      $b = hexdec(substr($val, 5, 2));
      $lines[] = "{$var}-rgb:$r,$g,$b;";
    }
  }
  if ($lines) {
    $variables['#attached']['html_head'][] = [
      ['#tag' => 'style', '#value' => 'html:root{' . implode('', $lines) . '}'],
      'jarvis-colors',
    ];
  }
}
```

Why `html:root` instead of plain `:root`? Specificity. `html:root` (0,0,1,1) beats
`overrides.css`'s `:root` defaults regardless of stylesheet order, so the admin's choices
always win. Now, in `overrides.css`, any region that reads one of those variables re-skins
itself automatically:

```css
.jarvis-footer { background: var(--jarvis-footer-bg); color: var(--jarvis-footer-color); }
.jarvis-page-title { background: var(--jarvis-title-bg); color: var(--jarvis-title-color); }
h1, h2, h3 { color: var(--jarvis-heading-color); }
```

That's the payoff: **define a variable in the map → consume it in CSS → the region is
themeable with zero extra PHP.**

---

<a name="step-8-fonts"></a>
## Step 8 — Font settings (self-hosted Google Fonts)

Same idea, one level fancier. The admin picks a Google font per "slot" (base text,
headings, nav, site name, blockquote) and targets it with a CSS selector. On **save**, the
theme *downloads* those fonts and self-hosts them — so the live site never calls Google
(better privacy + GDPR + speed).

### 8a. A font catalogue

Ship a `google-fonts.json` listing the families and their available weights:

```json
{
  "families": {
    "Open Sans": ["300", "400", "600", "700", "300i", "400i"],
    "Inter":     ["400", "500", "600", "700"],
    "Playpen Sans": ["300", "400", "500"]
  }
}
```

The settings form reads this to populate the family dropdown and per-family weight options.

### 8b. Font slots (shared map, in `jarvis.theme`)

```php
/**
 * setting-key stem => [label, default CSS selector].
 * Each slot stores three settings: _family, _weight, _selector.
 */
function _jarvis_fonts() {
  return [
    'base'       => ['Base font', 'body'],
    'headings'   => ['Headings', 'h1, h2, h3, h4, h5, h6, .page-title'],
    'navigation' => ['Navigation', 'nav, nav ul li, nav a'],
    'site_name'  => ['Site name', '.site-name, .navbar-brand'],
    'blockquote' => ['Blockquote', 'blockquote, blockquote p'],
  ];
}
```

### 8c. The form (added to the same `theme_settings_alter`)

For each slot: a **family** `select`, a **weight/style** `select`, and a **CSS selector**
textfield, plus a live preview. `js/font-settings.js` repopulates the weight dropdown when
the family changes (using the `drupalSettings` catalogue you attached). The form registers a
**submit handler**:

```php
$form['jarvis_fonts']['#attached']['library'][] = 'jarvis/font-settings';
$form['jarvis_fonts']['#attached']['drupalSettings']['jarvisFonts']['families'] = $families;
$form['#submit'][] = 'jarvis_font_settings_submit';
```

### 8d. The download-and-self-host submit handler

On save, for each chosen font: fetch the Google `css2` payload with a Chrome User-Agent
(so Google returns modern `woff2`), download each referenced `.woff2` into
`public://jarvis-fonts/`, rewrite the `url()` to the local copy, and append a CSS rule that
applies the family to the slot's selector. Everything is written to one
`jarvis-fonts.css`:

```php
function jarvis_font_settings_submit(array &$form, FormStateInterface $form_state) {
  $fs = \Drupal::service('file_system');
  $dir = 'public://jarvis-fonts';
  $fs->prepareDirectory($dir, /* CREATE_DIRECTORY | MODIFY_PERMISSIONS */ 3);
  $client = \Drupal::httpClient();
  $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) … Chrome/120.0 Safari/537.36';
  // for each slot: build the css2 URL, fetch CSS, download every woff2,
  //   rewrite url() → local, and add a `selector { font-family: … }` rule …
  // then: $fs->saveData($generatedCss, "$dir/jarvis-fonts.css", FileExists::Replace);
  \Drupal::messenger()->addStatus(t('Fonts downloaded and self-hosted.'));
}
```

### 8e. Attach the generated stylesheet on every page

Back in `jarvis_preprocess_html()`, link the generated file if it exists (cache-busted by
its mtime):

```php
$css = 'public://jarvis-fonts/jarvis-fonts.css';
$real = \Drupal::service('file_system')->realpath($css);
if ($real && file_exists($real)) {
  $url = \Drupal::service('file_url_generator')->generateString($css);
  $variables['#attached']['html_head'][] = [
    ['#tag' => 'link', '#attributes' => ['rel' => 'stylesheet', 'href' => $url . '?' . filemtime($real)]],
    'jarvis-fonts',
  ];
}
```

The takeaway pattern is identical to colours: **shared map → form → save/output.** Colours
output inline on every request; fonts are generated once at save time into a file that's
then attached.

---

<a name="step-9-canvas"></a>
## Step 9 — Wiring the theme into Drupal Canvas

So far the components work in any SDC context. To let a site builder drag them onto a page
in **Canvas**, two things must be true:

1. **Canvas is installed** (`ddev drush en canvas canvas_field_component -y`).
2. Your theme declares **Canvas page regions** — the areas of the page shell that Canvas is
   allowed to manage.

A Canvas **page region** is a config entity that mirrors a theme region. Jarvis ships one
per region as `canvas.page_region.jarvis.<region>.yml`. Example
`canvas.page_region.jarvis.hero.yml`:

```yaml
langcode: en
status: false
dependencies:
  theme:
    - jarvis
id: jarvis.hero
region: hero
theme: jarvis
component_tree: {  }
```

- **`id: jarvis.hero`** and **`region: hero`** tie this Canvas region to the theme region
  named `hero` from your `info.yml`.
- **`component_tree: {}`** starts empty — the builder fills it by dragging components in.
- **`status: false`** means the region isn't force-enabled by default; enable the ones you
  want Canvas to own.

You provide one of these per region you want editable. Once they're imported and cache is
cleared, opening Canvas shows your `category: Jarvis` components in the sidebar, and dropping
one writes its config into that region's `component_tree`.

> **Where do these files come from?** You don't hand-write the whole `component_tree` — you
> build a page in the Canvas UI, then export the resulting config with
> `ddev drush config:export` (or the Canvas export). The YAML you see in `recipe/config/` is
> the *captured result* of arranging components visually, which the recipe replays on a
> fresh site.

---

<a name="step-10-content-templates"></a>
## Step 10 — Content templates (fielded nodes → components)

A **content template** answers: "when Drupal renders a *Jarvis Sample* node, how should its
fields map onto components?" It's a Canvas layout bound to a content type + view mode.

Jarvis ships `canvas.content_template.node.jarvis_sample.full.yml`. The important parts:

```yaml
id: node.jarvis_sample.full
content_entity_type_id: node
content_entity_type_bundle: jarvis_sample
content_entity_type_view_mode: full
component_tree:
  '0:…':
    component_id: sdc.jarvis.image        # Hero image component
    inputs:
      image:
        sourceType: entity-field
        expression: 'ℹ︎␜entity:node:jarvis_sample␝field_hero_banner␞…'   # ← binds a field
      image_style: hero_banner
      full_width: true
  '1:…':
    component_id: sdc.jarvis.section
    inputs: { width: normal, bg: none }
  '1:content:0:…':
    parent_uuid: …                        # nested inside the section's slot
    slot: content
    component_id: field_display.field_display
    inputs:
      field_name: field_publication_date
      formatter_id: datetime_default
  '2:first:0:…':
    component_id: sdc.jarvis.text
    inputs:
      body:
        sourceType: entity-field
        expression: 'ℹ︎␜entity:node:jarvis_sample␝field_body␞␟processed'  # body field → Text
```

The concepts a beginner needs:

- **`component_id: sdc.jarvis.image`** — references your SDC by machine path
  (`sdc.<theme>.<component>`).
- **`inputs`** are the component's props. A static value (`image_style: hero_banner`) is
  hard-coded; a **`sourceType: entity-field`** input with an `expression` *binds a node
  field* to the prop. That funky `ℹ︎␜entity:node…␝field_body␞` string is Canvas's field-path
  syntax — you don't type it by hand, Canvas writes it when you click "link to field" (the
  🔗 icon) in the UI.
- **Nesting** (`parent_uuid` + `slot`) is how a component lands *inside another component's
  slot* — here, a field display sits inside the Section's `content` slot.
- **Remember the binding rule:** a required prop only exposes the 🔗 link icon when the field
  it binds to is also required. And for image styles inside a template, use the SDC's own
  `|image_style` (via `twig_tweak`) — content templates can't use Canvas adapters.

To *style a whole content type's fields*, you edit its content template (a ContentTemplate
config entity) — you don't add a "styling field" to the node.

---

<a name="step-11-recipe"></a>
## Step 11 — Package it all as a recipe

A **recipe** installs the theme + its dependencies + config + demo content in one command.
It lives in `recipe/` and is driven by `recipe/recipe.yml`.

```yaml
name: 'Jarvis Theme'
description: 'Enables the Jarvis theme, required contrib modules, base config, the Jarvis
  Sample content type, and demo content. Requires Canvas + the Jarvis theme installed and
  cache rebuilt first (see README).'
type: 'Theme'
install:
  - twig_tweak
  - focal_point
  - canvas
  - canvas_field_component
  - jarvis
  - media
  - media_library
  - image
  - menu_ui
  - menu_link_content
  - datetime
  - options
  - path
config:
  actions:
    system.theme:
      simpleConfigUpdate:
        default: jarvis
    block.block.jarvis_main_menu:
      simpleConfigUpdate:
        status: true
        region: primary_menu
        settings:
          id: 'system_menu_block:main'
          level: 1
          depth: 2
          expand_all_items: true
    block.block.jarvis_site_branding:
      simpleConfigUpdate:
        status: true
        region: primary_menu
        settings:
          id: system_branding_block
          use_site_logo: true
          use_site_name: false
    # …more block placements (footer menu, breadcrumbs, messages, page title, …)
```

The three sections:

1. **`install:`** — every module (and the theme itself) to turn on, in dependency order.
   This is why applying the recipe on a clean site "just works."
2. **`config.actions:`** — surgical config changes. `simpleConfigUpdate` sets values
   (e.g. make `jarvis` the default theme) and **places blocks into regions** — this is what
   populates your `primary_menu`, `footer`, etc. Note the block IDs like
   `jarvis_site_branding` and `jarvis_main_menu` — *these are the exact IDs the page
   template renders by name* in Step 3.
3. **Config & content files** (in `recipe/config/` and `recipe/content/`) — everything else
   is imported wholesale:
   - `recipe/config/` holds the field storage/instances, the `jarvis_sample` node type,
     image styles (`hero_banner`, `wide`), the focal-point crop type, media types, the
     Canvas page regions (Step 9), the content template (Step 10), and `jarvis.settings.yml`
     (the default colours/fonts).
   - `recipe/content/` holds demo content as YAML (a Test Blog node, a Test Page Canvas
     page, media, files, menu links) via **default_content**. UUID-named files are entities;
     the raw `.png`/`.jpg` are the referenced image files.

To build these config files, you *don't* write them by hand. You configure everything on a
working site (create the content type, add fields, set up Canvas, pick colours), then
export:

```bash
ddev drush config:export
# copy the relevant jarvis.*, canvas.*, field.*, node.type.*, image.style.* files
# into web/themes/custom/jarvis/recipe/config/
```

`recipe/config/jarvis.settings.yml` is worth a peek — it's the exported default theme
settings, so a fresh install starts with the right brand colours and fonts already chosen:

```yaml
logo:
  use_default: 1
jarvis_color_primary: '#2d6cdf'
jarvis_color_secondary: '#1b2a4a'
jarvis_color_title_bg: '#2d6cdf'
jarvis_color_footer_bg: '#000000'
jarvis_font_base_family: 'Open Sans'
jarvis_font_base_weight: '300'
jarvis_font_headings_family: 'Open Sans'
jarvis_font_headings_weight: '600'
# …etc…
```

---

<a name="step-12-install"></a>
## Step 12 — Install, apply, and test

Because the recipe's Canvas config references the theme, the **order matters**. On a fresh
site:

```bash
# 1. Make the theme discoverable and install Canvas first.
ddev drush theme:enable jarvis -y
ddev drush en canvas canvas_field_component -y
ddev drush cr

# 2. Apply the recipe (path is relative to the Drupal root).
ddev drush recipe web/themes/custom/jarvis/recipe

# 3. Rebuild caches and log in.
ddev drush cr
ddev drush uli
```

Then verify, in order:

1. **Front end loads** with Bootstrap styling and your logo in the nav. → theme + libraries
   OK.
2. **`/admin/appearance/settings/jarvis`** shows the Colours and Fonts sections. Change a
   colour, save, reload → the site re-skins. → Steps 7–8 OK.
3. **Save the Fonts form** → check `sites/default/files/jarvis-fonts/jarvis-fonts.css`
   exists and the site uses the new fonts. → self-hosting OK.
4. **Edit the Test Page in Canvas** → your `Jarvis` and `Jarvis Layout` components appear in
   the sidebar; drag a Hero in, set its image, save, view the page. → Steps 4–6, 9 OK.
5. **View the Test Blog node** → its hero field renders as the Hero component, body as Text,
   per the content template. → Step 10 OK.

If something's missing, it's almost always caching or order — see below.

---

<a name="troubleshooting"></a>
## Troubleshooting & cheat sheet

**"My new component / region / setting doesn't appear."**
→ `ddev drush cr`. SDC, libraries, regions, and theme settings are all discovery-cached.

**"The recipe failed on a Canvas config import."**
→ You applied it before Canvas or the theme was installed. Do Step 12 in order: theme →
Canvas → `cr` → recipe.

**"A component prop won't bind to a field (no 🔗 icon in Canvas)."**
→ The SDC prop is `required` but the target content field is not required. Make the field
required, or drop `required` from the prop.

**"The Canvas preview looks broken / clipped."**
→ You used `vh`/`vw` somewhere. Canvas renders in an iframe with no real viewport. Use
`rem`/`px`/`%`.

**"I need a named image style in a component."**
→ Pass the raw file URI as a prop and use `twig_tweak`'s `|image_style('hero_banner')` in
the SDC. Don't use a Canvas adapter inside a content template.

**"How do I regenerate the recipe after changing things in the UI?"**
→ `ddev drush config:export`, then copy the changed `jarvis.* / canvas.* / field.* /
node.type.* / image.style.*` files into `recipe/config/`.

### The seven files that define the theme

| File | Job |
|------|-----|
| `jarvis.info.yml` | Declares the theme + its regions. |
| `jarvis.libraries.yml` | Declares CSS/JS bundles (Bootstrap, settings assets). |
| `templates/page.html.twig` | The page shell / region layout. |
| `css/overrides.css` | Bootstrap-variable theming + `jp-` spacing utilities. |
| `jarvis.theme` | Preprocess hooks: output colours + attach fonts. |
| `theme-settings.php` | The colour + font admin form and its handlers. |
| `components/*/` | The SDC kit — one folder per component. |

### The one pattern that repeats everywhere

Every Jarvis component is: **`.component.yml` (props via JSON-Schema + `enum`/`meta:enum`
dropdowns, `$ref` for images, `slots` for nesting) → `.twig` (map props onto Bootstrap
classes, reuse the `jp-` spacing snippet)**. Learn it once on the Text component, and Hero,
Card, Image, Video, and the column layouts are all variations on it.

Happy theming.
