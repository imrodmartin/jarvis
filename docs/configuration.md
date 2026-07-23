# Configuration

Configure Jarvis at **Appearance > Settings > Jarvis**
(`/admin/appearance/settings/jarvis`). The screen has three sections: Colors,
Fonts, and Font sizes. Every value is stored as a theme setting and applied as a
CSS custom property, so a region restyles the moment you save.

## Colors

Each colour is a hex text field paired with a native colour picker. The picker is
the live swatch; JavaScript keeps the two in sync. Only the hex field is saved, so
there is one stored value per colour.

| Setting | What it colours |
|---|---|
| Primary color | Buttons, links, primary accents |
| Secondary color | Secondary accents |
| Heading color | Headings |
| Header background / text / link | The site header region |
| Title background / text | The page title band |
| Footer background / text | The footer region |

Only valid `#rrggbb` values are emitted into the page. An invalid value is dropped
rather than printed, which closes CSS injection through the setting.

The settings form shows a live WCAG contrast badge next to colour pairs that sit on
top of each other (for example header text on header background). Background colours
that take automatic black-or-white text show which one they will use. A save-time
validation warns when a pair fails the contrast threshold.

## Fonts

Pick any Google font per slot and target it with a CSS selector. On save, Jarvis
downloads the chosen fonts and writes a self-hosted stylesheet to
`public://jarvis-fonts/`. No request goes to Google from the live site.

The slots are Base, Headings, Navigation, Site name, and Blockquote. Each slot
stores three values:

- Family: the Google font family, or None to leave it unset.
- Weight and style: the available weights for that family, repopulated when you
  change the family.
- CSS selector: which elements the font applies to. Each slot has a sensible
  default selector you can override.

## Font sizes

Set the base size and each heading level for desktop and mobile separately.

- Base is in pixels. It sets the root `rem` size on the `html` element.
- H1 through H6 are in `rem`, so they scale with the base.
- Mobile values apply below the theme's mobile breakpoint.

The emitted `--jarvis-fs-*` custom properties are consumed by `overrides.css`.

## For content editors

The colour and overlay controls exist so editors cannot ship unreadable text. See
[Accessibility](usage/accessibility.md) for how automatic overlay contrast, safe
colour fallbacks, and the Canvas contrast badge work.
