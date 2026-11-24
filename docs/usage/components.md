# Components

Jarvis ships twenty-four SDC components. Canvas lists them under the **Jarvis**
category.

**The prop-by-prop reference is the
[component reference](../components.html)** — one card per component with its
full prop table, enums, and the `.component.yml` source. It is the canonical,
maintained list; this page is just the map.

## Shared spacing props

Twenty of the twenty-four components carry the same spacing controls
(**Block region**, **Button**, **Card Full Image** and **Share** are the
exceptions):

- `padding`: which sides get padding (none, all, top, bottom, left, right).
- `padding_size`: small (10px), medium (20px), or large (30px).
- `margin`: which sides get margin, same options as padding.
- `margin_size`: small, medium, or large.
- `vertical_padding`: a boolean that adds a standard block of vertical padding.

## Column alignment

Every layout component carries one alignment control per column — Left, Center
or Right, defaulting to Left. It aligns whatever is placed in that column:
component copy and headings, buttons, and any inline content. Block-level,
full-width things have nothing to centre and stay put — images, maps, video —
and the Stat card is always centred by its own CSS.

Two components answer for themselves. **WYSIWYG** always prints its own
alignment and ignores the column, so use it when one block must differ from
the column it sits in. **Text** follows the column while its own alignment is
Left, and overrides it when set to Center or Right.

## Content components

- **Hero** — full-width banner: heading, subtext, CTA button, background image
  with automatic overlay contrast.
- **Card** — image top, left, right, or as background; title, body, link.
- **Call to Action** — centered overline subtitle, heading, text, button.
- **Large Call to Action** — eyebrow, large heading, lead text, three
  icon-and-sentence rows, button plus reversed link.
- **Text** — rich text with width and alignment controls.
- **WYSIWYG** — freeform CKEditor block with an optional readable measure.
- **Image** — responsive image with caption, image-style, full-width, and
  LCP-priority options.
- **Image Overlay** — image with a coloured text card overlaid in a corner.
- **Video** — YouTube/Vimeo embed, media-library remote video, or a direct
  file, with captions support.
- **Video with Sidebar** — video beside an eyebrow/title/description column;
  placeable in Canvas or driven by a View.
- **Video Background** — full-bleed looping background video with text and
  buttons over it.
- **Timeline** — up to six numbered steps, rendered as a vertical timeline or
  tabs.
- **Stat card** — icon, big (optionally animated) number, description.
- **Person** — portrait, name, position, contact details, social links.
- **Map** — keyless Google Map embed from a one-line address.
- **Button** — a single Bootstrap-styled button.
- **Share** — share buttons for the current page: Facebook, X, LinkedIn,
  Bluesky, Reddit, email and copy link.

## Bridge components

- **Block region** — prints the blocks placed in **Block region 1/2/3** on the
  Block layout page, which the page template never prints itself. Use it for a
  block Canvas refuses to place — one whose settings are not strictly
  validatable, or that needs a context value, such as an AI chatbot. Content
  blocks and views blocks do not need it: they appear in the library on their
  own. See [Regions and layout](regions.md).

## Layout components

Layout components hold other components in slots.

- **1 Column / 2 Columns / 3 Columns / 4 Columns** — responsive column rows with
  background image, overlay, ratio and per-column alignment controls; one slot
  per column.
- **3 Columns (custom widths)** — three columns with a percentage width and an
  alignment set per column; a column set to 0% collapses.
- **Card Full Image** — full-width two-column band: an edge-to-edge image slot
  beside a rich-text content slot.
