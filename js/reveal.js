/**
 * @file
 * Scroll reveal for the 1/2/3-column sections (the `animation` prop).
 *
 * The section ships visible and this arms it — adds the class css/reveal.css
 * hangs the hidden state on — then drops that class again as the section
 * enters the viewport. Done that way round so a JS error, a blocked file or
 * an old browser leaves the page readable instead of blank.
 *
 * A behavior with once(), like the rest of the theme's JS, so sections that
 * arrive after first paint (Views AJAX pager, Canvas preview refresh) reveal
 * too. Each section is unobserved once revealed: the fade plays on the way in
 * and never replays.
 */
(function (Drupal, once) {
  'use strict';

  // ADA (WCAG 2.3.3): reduced motion means no arming at all, so the section
  // simply stays where it is.
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Inside the Canvas editor preview, leave everything visible — an editor
  // should never have to scroll a section into view to see what they placed.
  var editor = false;
  try {
    editor = !!(window.frameElement && window.frameElement.closest('[data-testid="canvas-editor-frame"]'));
  } catch (e) { /* cross-origin parent: not the Canvas editor */ }

  Drupal.behaviors.jarvisReveal = {
    attach: function (context) {
      var sections = once('jarvis-reveal', '.jarvis-reveal', context);
      if (!sections.length || still || editor || !('IntersectionObserver' in window)) {
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.remove('jarvis-reveal--armed');
          io.unobserve(entry.target);
        });
      }, {
        // Wait until the section is ~10% of the viewport in, so it fades as it
        // clears the fold rather than the instant its top edge appears.
        rootMargin: '0px 0px -10% 0px'
      });
      sections.forEach(function (section) {
        section.classList.add('jarvis-reveal--armed');
        io.observe(section);
      });
    }
  };
})(Drupal, once);
