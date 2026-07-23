# Jarvis

Jarvis is a Drupal theme for Canvas and Layout Builder. It ships a set of Single
Directory Components (SDC) that content editors drag into place, a Bootstrap 5
base, and colour, font, and font-size controls on the theme settings screen. WCAG
2.2 AA safeguards are built in: overlay contrast is corrected automatically,
colours fall back to safe values, and the settings form shows live contrast
badges.

Jarvis targets Drupal `^11 || ^12` and PHP `>= 8.3`.

## Key features

- Twenty SDC components (hero, card, section, columns, stat, person, video, map,
  and more) that Canvas discovers on cache rebuild.
- Bootstrap 5.3 as the base CSS layer, bundled with the theme.
- Colour controls with hex fields paired to native colour pickers, applied as CSS
  custom properties.
- Per-slot Google fonts, downloaded and self-hosted on save. No request goes to
  Google from the live site.
- Desktop and mobile font-size controls for the base size and each heading level.
- Automatic overlay contrast on hero, card, and column layouts (see
  [Accessibility](usage/accessibility.md)).
- Canvas editor extensions: a wider settings tray while a rich-text field is
  focused, and an overlay-opacity slider with a live contrast badge on component
  forms.
- A companion recipe that installs the theme, its modules, and demo content in one
  step.

## Where to start

- [Installation](installation.md): require the theme with Composer, enable it, and
  apply the recipe.
- [Configuration](configuration.md): set colours, fonts, and font sizes.
- [Usage](usage/index.md): place components in Canvas and understand the page
  regions.
