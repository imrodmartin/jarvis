# Regions and layout

The page shell is built on Bootstrap 5. Place blocks in these regions at
**Structure > Block layout** (`/admin/structure/block`). The recipe places the
theme's default blocks in the right regions on install.

## Regions

| Region | Machine name | Typical use |
|---|---|---|
| Header | `header` | Logo, site name, utility links |
| Primary menu | `primary_menu` | Main navigation |
| Breadcrumb | `breadcrumb` | Breadcrumb trail |
| Help | `help` | Admin help messages |
| Page title | `page_title` | The page title band |
| Hero | `hero` | A full-width hero above the content |
| Highlighted | `highlighted` | Status messages, alerts |
| Content top | `content_top` | Above the main content |
| Left sidebar | `sidebar_left` | Left column |
| Content | `content` | Main content |
| Right sidebar | `sidebar_right` | Right column |
| Content bottom | `content_bottom` | Below the main content |
| Footer | `footer` | Footer blocks |
| Block region 1 | `block_region_1` | Blocks pulled into a Canvas page — see below |
| Block region 2 | `block_region_2` | Same |
| Block region 3 | `block_region_3` | Same |

## Getting a block onto a Canvas page

A Canvas-managed page is built from Canvas's own component tree, so a block you
place at **Structure > Block layout** does not show up on it. Block layout still
governs ordinary Drupal pages, and the footer, which the theme prints from the
region either way. For everything else there are two routes, and which one you
need depends on the block.

### Content blocks and views blocks: place them directly

Every reusable content block is listed in the Canvas component library under its
own name — "Site alert", "Promo card", whatever you called it at
`/admin/content/block`. Views blocks are there too. Drop one into a page the same
way you drop a Hero.

This is what you want for content shared between pages. Put the block in one
page's tree and it appears on that page; put it in a region tree such as
**Content bottom** and it appears on every page, still editable in one place
rather than five.

Saving a new content block is enough — it appears in the library straight away,
with no cache clear. Nothing to enable first.

> Needs Jarvis 4.3.3 with the Jarvis Canvas module 2.3.0 or newer. Before that,
> Canvas created these blocks as *disabled* components (they come from Drupal
> core modules, and Canvas disables core-provided blocks on sight), so they never
> reached the library and the Block region route below was the only way in. On an
> upgraded site, `drush updb` enables the ones you already had.

To take one back out of the library, disable it at
**Appearance > Components** (`/admin/appearance/component`). That choice sticks —
nothing re-enables it later.

### Other blocks: Block regions 1-3

Some blocks Canvas will not place at all: anything whose settings are not
strictly validatable, and anything that needs a context value. An AI chatbot
block is the usual example. Those never appear in the library, however long you
look.

That is what `block_region_1`, `block_region_2` and `block_region_3` are for.
They are real regions on the Block layout page, but `page.html.twig` never prints
them. Instead:

1. Place the block in **Block region 1** (or 2, or 3) at
   **Structure > Block layout**.
2. In Canvas, drop the **Block region** component where you want it on the page.
3. Set its **Region** prop to the region you used.

The component prints whatever is in that region, honouring each block's
visibility conditions and carrying its cache metadata, so a block restricted to
certain pages stays restricted.

Three regions, so you can have three of these in play without them colliding —
one for a chatbot, one for a signup widget, one spare.

## Collapse when empty

The header, hero, and both sidebars collapse when they hold no content, so an empty
hero does not paint its band and an empty sidebar does not claim its column.

This needs care in the Canvas editor. Canvas emits HTML comment markers for every
enabled region even when the region is empty, which a plain emptiness test reads as
full. The theme strips those comments before testing whether a region has real
content, then prints the raw markers again so the editor keeps its region map. You
get a clean collapse on the live site and a working region map in the editor.

## Local task tabs

The View, Edit, and Revisions tabs are rendered with Bootstrap nav markup. The
theme adds the `nav-link` and `active` classes to the tab links so they match the
rest of the Bootstrap styling.
