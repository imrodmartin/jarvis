# Components

Jarvis ships twenty-one SDC components. Canvas lists them under the **Jarvis**
category.

**The prop-by-prop reference is the
[component reference](../components.html)** — one card per component with its
full prop table, enums, and the `.component.yml` source. It is the canonical,
maintained list; this page is just the map.

## Shared spacing props

Nineteen of the twenty-one components carry the same spacing controls
(**Button** and **Card Full Image** are the exceptions):

- `padding`: which sides get padding (none, all, top, bottom, left, right).
- `padding_size`: small (10px), medium (20px), or large (30px).
- `margin`: which sides get margin, same options as padding.
- `margin_size`: small, medium, or large.
- `vertical_padding`: a boolean that adds a standard block of vertical padding.

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

## Layout components

Layout components hold other components in slots.

- **Section** — a width/background wrapper with one content slot.
- **1 Column / 2 Columns / 3 Columns** — responsive column rows with
  background image, overlay, and ratio controls; one slot per column.
- **Card Full Image** — full-width two-column band: an edge-to-edge image slot
  beside a rich-text content slot.
