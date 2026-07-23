# Accessibility

Jarvis carries WCAG 2.2 AA safeguards so an editor cannot ship unreadable text
through the theme settings or a component form. Four mechanisms do the work.

## Automatic overlay contrast

Hero, card, and column layouts that put text over a background image run an
auto-contrast check (`js/contrast.js`, attached per component). It measures the
effective background under the text and picks the text colour and overlay strength
that meet the AA contrast ratio, so text stays readable whatever image an editor
drops in.

## Safe colour fallbacks

Background colours that take automatic text (background 1 and background 2) get
black or white text chosen for contrast, computed in `hook_preprocess_html`. If a
stored colour is missing or invalid, the theme falls back to a safe default rather
than emitting a broken value.

## Colour injection is closed

Only valid `#rrggbb` values are emitted into the page style. An invalid setting
value is dropped, not printed, so a colour field cannot inject CSS.

## Live contrast badges

Two places show a live WCAG pass or fail badge as you edit:

- The theme settings form (`js/color-settings.js`) shows a badge next to each
  colour pair that overlaps, and warns on save when a pair fails.
- The Canvas editor (`js/canvas-overlay.js`) adds an overlay-opacity slider with a
  live check mark or cross on component prop forms, so an editor sees the contrast
  result while adjusting the overlay.

## Editor guidance in components

Component props include guidance where a choice affects accessibility. The Hero
heading level prop, for example, tells editors to use H1 only once per page and pick
H2 for additional heroes, keeping the heading order correct for assistive
technology.
