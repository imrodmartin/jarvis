# Components

Jarvis ships twenty SDC components. Canvas lists them under the **Jarvis** category.
This page describes each one and its props.

## Shared spacing props

Most components carry the same spacing controls. They are listed once here and not
repeated per component:

- `padding`: which sides get padding (none, all, top, bottom, left, right).
- `padding_size`: small (10px), medium (20px), or large (30px).
- `margin`: which sides get margin, same options as padding.
- `margin_size`: small, medium, or large.
- `vertical_padding`: a boolean that adds a standard block of vertical padding.

## Content components

### Hero

Full-width hero banner with heading, subtext, a call-to-action button, and a
background image. Required: `heading`.

Key props: `heading_level` (h1, h2, h3), `subheading`, `cta_text`, `cta_href`,
`image`, `overlay` (opacity percentage), `align` (left, center, right), `text_color`
(light or dark). Use H1 only once per page; pick H2 for additional heroes.

### Card

Flexible card with the image at top, left, right, or as the background. Required:
`title`.

Key props: `variant`, `image`, `heading_level`, `body`, `link_text`, `link_href`,
`overlay`, `text_color`. When the image is the background, overlay contrast is
corrected automatically (see [Accessibility](accessibility.md)).

### Call to Action

Centered call-to-action with an overline subtitle, heading, text, and a buttons
slot. Required: `heading`.

Key props: `subtitle`, `text`, `button_text`, `button_href`, `bg`.

### Large Call to Action

Eyebrow, large heading, lead text, three icon-and-sentence rows separated by rules,
a primary button, and a reversed-colour link. Required: `heading`.

Key props: `eyebrow`, `text`, `button_text`, `button_href`, `link_text`,
`link_href`.

### Text

Rich text block with width and alignment controls. Required: `body`.

Key props: `width`, `align`, `color`.

### WYSIWYG

Freeform CKEditor rich-text block, full width by default with an optional readable
measure. Required: `body`.

Key props: `measure`, `align`.

### Image

Responsive image with an optional caption and a full-width option. No required prop.

Key props: `image`, `image_style`, `image_uri`, `caption`, `full_width`,
`match_height`, `rounded`, `priority`.

### Image Overlay

An image with a coloured text card overlaid in the lower corner. No required prop.

Key props: `image`, `heading`, `text`, `position` (left or right), `background`,
`overlay_opacity`, `rounded`, `match_height`.

### Video

Responsive video from an embed URL (YouTube or Vimeo) or a direct video file.
Required: `video_url`.

Key props: `title`, `captions_url`, `captions_lang`, `aspect`, `full_width`,
`autoplay`, `muted`.

### Video with Sidebar

A video on one side with an eyebrow, title, description, and call-to-action buttons
alongside. Placeable in Canvas or driven by a View. No required prop.

Key props: `video` (media library) or `video_url`, `aspect`, `video_right`,
`eyebrow`, `title`, `heading_level`, `description`.

### Stat card

Centered stat with an icon, a big number, and a description. Required: `title`.

Key props: `icon`, `number_color`, `count_up` (animate the number), `body`.

### Person

Portrait, name, position, phone, email, a link, and social links. No required prop.

Key props: `variant`, `image`, `name`, `position`, `phone`, `email`, `link_text`,
`link_href`, `linkedin`, `x`, `facebook`, `instagram`, `youtube`, `github`.

### Map

Google Map from a one-line address, a keyless embed in the simple_gmap style, with
zoom and a link out. Required: `address`.

Key props: `zoom`, `height`, `show_link`, `link_text`.

### Button

A single call-to-action button with Bootstrap styles. Required: `text`.

Key props: `href`, `variant`, `size`, `new_tab`.

## Layout components

Layout components hold other components in a slot.

### Section

Container that holds other components in its slot. No required prop.

Key props: `width`, `bg`, `no_padding`. Slot: content.

### 1 Column

Single-column row spanning the full width. No required prop.

Key props: `width`, `background`, `background_image`, `overlay`, `text_color`, `gap`.
Slot: column.

### 2 Columns

Two columns side by side on desktop, stacked on mobile. No required prop.

Key props: `width`, `background`, `background_image`, `overlay`, `text_color`, `gap`,
`ratio`. Slots: column 1, column 2.

### 3 Columns

Three columns on desktop, two on tablet, stacked on mobile. No required prop.

Key props: `width`, `background`, `background_image`, `overlay`, `text_color`, `gap`.
Slots: column 1, column 2, column 3.

### Card Full Image

Full-width two-column band: an image that fills its half edge to edge beside a
rich-text column. No required prop.

Key props: `image_right`, `fade_edge`, `background`. Slots: image (drop an Image
component), content (drop a Text or WYSIWYG component).
