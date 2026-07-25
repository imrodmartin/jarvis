/**
 * @file
 * Live-site overlay auto-contrast for the hero, card and column components:
 * raises the image overlay until the text passes WCAG AA (4.5:1) on the
 * sampled background image. The maths itself lives in js/wcag.js. Dark overlays are raised for light text; light
 * overlays (.jarvis-bg__overlay--light, columns with dark text) are raised
 * for dark text. Attached per component via libraryOverrides dependencies
 * (jarvis/contrast) in the hero, card and one/two/three-column .component.yml.
 */
(function (Drupal, once, wcag) {
  'use strict';

  // [container selector, overlay selector, dark-text class] per component.
  // Hero/card: dark/black text sits on the bare image (their CSS fallback
  // handles contrast), so those variants are skipped via the class. Columns
  // (null class) always tune: their dark-text case flips to a light overlay
  // (.jarvis-bg__overlay--light) which is tuned against dark text instead.
  var TARGETS = [
    ['.jarvis-hero[style*="background-image"]', '.jarvis-hero__overlay', 'jarvis-hero--text-dark'],
    ['.jarvis-card--background[style*="background-image"]', '.jarvis-card__overlay', 'jarvis-card--text-dark'],
    ['.jarvis-columns[style*="background-image"]', '.jarvis-bg__overlay', null]
  ];

  // Shared engine — see js/wcag.js, attached via the jarvis/wcag dependency.
  var extremeBlock = wcag.extremeBlock;
  var neededAlpha = wcag.neededAlpha;
  var neededAlphaLight = wcag.neededAlphaLight;

  function tune(el, overlaySel, darkClass) {
    // Hero/card: dark AND black text sit on the bare image — skip both.
    if (darkClass) {
      var blackClass = darkClass.replace('--text-dark', '--text-black');
      if (el.classList.contains(darkClass) || el.classList.contains(blackClass)) return;
    }
    var overlay = el.querySelector(overlaySel);
    if (!overlay) return;
    // Light overlay = dark text on a whitened image; dark overlay = white text.
    var lightOverlay = overlay.classList.contains('jarvis-bg__overlay--light');
    var m = (el.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
    if (!m) return;

    var floor = parseFloat(overlay.style.opacity) || 0;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var cv = document.createElement('canvas');
        cv.width = cv.height = 16;
        var cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, 16, 16);
        var d = cx.getImageData(0, 0, 16, 16).data;
        // Score against the worst 4x4 block, not the whole-image average:
        // text can cross a bright (or dark) patch that an average would hide.
        var best = extremeBlock(d, 16, 4, lightOverlay);
        overlay.style.opacity = (lightOverlay
          ? neededAlphaLight(best[0], best[1], best[2], floor)
          : neededAlpha(best[0], best[1], best[2], floor)).toFixed(2);
      } catch (e) {
        // Cross-origin image taints the canvas -> can't sample. Fail safe:
        // strengthen the overlay in its own direction.
        overlay.style.opacity = Math.max(floor, 0.6).toFixed(2);
      }
    };
    // 404, CSP block or network failure: nothing to sample either, so fail
    // safe the same way rather than leaving the author's floor unprotected.
    img.onerror = function () {
      overlay.style.opacity = Math.max(floor, 0.6).toFixed(2);
    };
    img.src = m[1];
  }

  // once() replaces the old dataset flag inside tune(): same
  // process-each-element-exactly-once guarantee, but scoped to `context` so
  // elements arriving later are picked up instead of ignored.
  function run(context) {
    TARGETS.forEach(function (t) {
      once('jarvis-contrast', t[0], context || document).forEach(function (el) {
        tune(el, t[1], t[2]);
      });
    });
  }

  if (typeof document === 'undefined') return;

  // Inside the Canvas editor preview, show the author's raw overlay value —
  // auto-darkening here would fight the overlay slider and make it look dead.
  // The editor badge (js/canvas-overlay.js) reports compliance instead; the
  // live site keeps the auto-raise safety net.
  try {
    if (window.frameElement && window.frameElement.closest('[data-testid="canvas-editor-frame"]')) return;
  } catch (e) { /* cross-origin parent: not the Canvas editor */ }

  // A behavior, not a one-shot on DOMContentLoaded: sections arriving after
  // first paint — a Views AJAX pager, a Canvas preview refresh, anything
  // rendered into the page later — used to keep the author's raw overlay with
  // no contrast tuning at all, which is the case the safety net exists for.
  Drupal.behaviors.jarvisContrast = {
    attach: function (context) {
      run(context);
    }
  };
})(Drupal, once, window.jarvisWcag);
