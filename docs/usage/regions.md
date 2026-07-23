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
