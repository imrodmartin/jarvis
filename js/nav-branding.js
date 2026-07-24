/**
 * @file
 * Move the site-branding block out of the mobile offcanvas drawer.
 *
 * The primary-menu region is a Canvas PageRegion rendered from a component
 * tree, so its blocks arrive as one blob under UUID-based ids. A preprocess
 * hook has no addressable branding child to lift out and the page template
 * cannot split it either (both were tried), so relocating it in the DOM is the
 * only seam available.
 *
 * Moves the whole branding wrapper rather than just its <a>: the block also
 * carries the site name and slogan, which were previously orphaned inside the
 * drawer. Registered as a behavior with once() so Canvas previews, Views AJAX
 * and any other re-render get the same treatment, not only the initial load.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.jarvisNavBranding = {
    attach: function (context) {
      once('jarvis-nav-branding', '.jarvis-branding-wrap', context).forEach(function (wrap) {
        var drawer = document.querySelector('.jarvis-primary-nav .offcanvas-body');
        if (!drawer) {
          return;
        }
        // The branding block is whichever child holds the rel="home" link — its
        // id is a UUID under Canvas, so it cannot be selected by block name.
        var home = drawer.querySelector('a[rel="home"]');
        if (!home) {
          return;
        }
        wrap.appendChild(home.closest('[id^="block-"]') || home);
      });
    }
  };
})(Drupal, once);
