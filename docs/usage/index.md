# Usage overview

Jarvis gives content editors a palette of components to build pages, and gives the
site a fixed set of regions to place blocks. This section covers both.

- [Components](components.md): the full component list with their props.
- [Regions and layout](regions.md): the page shell and where blocks go.
- [Accessibility](accessibility.md): the contrast safeguards built into the theme.

## Placing components in Canvas

Canvas discovers the theme's components on cache rebuild and lists them in its
component menu under the **Jarvis** category. Drag a component onto the canvas, then
fill its fields in the settings tray on the right.

Components fall into two groups:

- Layout components hold other components in a slot: Section, 1 Column, 2 Columns,
  3 Columns, and Card Full Image. Drop content components inside them.
- Content components render on their own: Hero, Card, Text, WYSIWYG, Image, Video,
  Stat card, Person, Map, Call to Action, and the others.

Most components share a common set of spacing props (padding, margin, and vertical
padding) so you can control the gaps without extra wrapper markup. See
[Components](components.md) for the per-component props.

## Component props and slots

Each component declares its inputs in a `*.component.yml` file:

- Props are the fields you fill in the settings tray (headings, text, links,
  images, alignment, colours).
- Slots are drop zones for other components. Layout components use slots; content
  components usually do not.

A prop marked required must be filled before the component renders. The
[Components](components.md) page lists the required prop for each component.

## Driving components from content

Some components can be placed by hand in Canvas or driven by a node's fields through
a Canvas content template. The recipe sets up the **Jarvis Sample** content type
this way: its fields map to component props so an editor fills a normal node form
and the component renders on the full view. Video and Video with Sidebar also
accept a media-library reference or a plain URL, so they work either placed in
Canvas or fed by a View.
