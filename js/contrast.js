/**
 * @file
 * Shared WCAG contrast engine for the hero, card and column components:
 * auto-tunes the image overlay until the text passes WCAG AA (4.5:1) on the
 * sampled background image. Dark overlays are raised for light text; light
 * overlays (.jarvis-bg__overlay--light, columns with dark text) are raised
 * for dark text. Attached per component via libraryOverrides dependencies
 * (jarvis/contrast) in the hero, card and one/two/three-column .component.yml.
 */
(function (Drupal, once) {
  'use strict';

  var NEED = 4.5;        // WCAG AA, normal text (subheading/body is the tightest case)
  var TEXT = 1;          // relative luminance of #fff text
  var DARK_TEXT = 0.011; // relative luminance of #212529 body text (matches canvas-overlay.js)

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

  // sRGB channel (0-255) -> linear
  function chan(c) {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function lum(r, g, b) {
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  }
  function contrast(l1, l2) {
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  // Average [r,g,b] of the worst-case bs×bs block in a size×size RGBA sample:
  // brightest block for light text, darkest block for dark text. Blocks (not
  // single pixels) so one noisy pixel can't dominate.
  function extremeBlock(d, size, bs, darkest) {
    var best = [0, 0, 0];
    var bestLum = darkest ? 2 : -1;
    for (var by = 0; by < size; by += bs) {
      for (var bx = 0; bx < size; bx += bs) {
        var r = 0, g = 0, b = 0, n = 0;
        for (var y = by; y < by + bs; y++) {
          for (var x = bx; x < bx + bs; x++) {
            var i = (y * size + x) * 4;
            r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
          }
        }
        r /= n; g /= n; b /= n;
        var l = lum(r, g, b);
        if (darkest ? l < bestLum : l > bestLum) { bestLum = l; best = [r, g, b]; }
      }
    }
    return best;
  }

  // Smallest black-overlay alpha (>= floor) that makes white text pass on [r,g,b].
  // A black overlay in sRGB space scales each channel by (1 - a).
  function neededAlpha(r, g, b, floor) {
    var a = floor;
    while (a < 0.95) {
      if (contrast(TEXT, lum(r * (1 - a), g * (1 - a), b * (1 - a))) >= NEED) break;
      a += 0.02;
    }
    return a;
  }

  // Smallest white-overlay alpha (>= floor) that makes dark text pass on [r,g,b].
  // A white overlay blends each channel toward 255 (same model as the
  // canvas-overlay.js editor badge).
  function neededAlphaLight(r, g, b, floor) {
    var a = floor;
    while (a < 0.95) {
      if (contrast(DARK_TEXT, lum(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a)) >= NEED) break;
      a += 0.02;
    }
    return a;
  }

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

  // ponytail: node self-check. `node contrast.js` runs it, the browser skips
  // it. It calls the SAME functions the browser path uses — an earlier version
  // re-implemented them here, so a bug in the real solver still passed.
  function selfCheck() {
    var assert = require('assert');

    // Ratio + luminance primitives.
    assert.strictEqual(Math.round(contrast(TEXT, lum(0, 0, 0))), 21);  // white on black = 21:1
    assert.strictEqual(contrast(TEXT, lum(255, 255, 255)), 1);         // white on white = 1:1

    // Dark-overlay solver: a black image needs none, light images get darkened
    // until white text passes, and a sufficient user floor is left alone.
    assert.strictEqual(neededAlpha(0, 0, 0, 0), 0);
    [[255, 255, 255], [230, 225, 210], [200, 180, 150]].forEach(function (c) {
      var a = neededAlpha(c[0], c[1], c[2], 0);
      assert.ok(a > 0);
      assert.ok(contrast(TEXT, lum(c[0] * (1 - a), c[1] * (1 - a), c[2] * (1 - a))) >= NEED);
    });
    assert.strictEqual(neededAlpha(230, 225, 210, 0.8), 0.8);

    // Light-overlay solver (columns with dark text): mirror of the above.
    assert.strictEqual(neededAlphaLight(255, 255, 255, 0), 0);
    [[0, 0, 0], [40, 40, 60], [90, 70, 50]].forEach(function (c) {
      var a = neededAlphaLight(c[0], c[1], c[2], 0);
      assert.ok(a > 0);
      assert.ok(contrast(DARK_TEXT, lum(c[0] + (255 - c[0]) * a, c[1] + (255 - c[1]) * a, c[2] + (255 - c[2]) * a)) >= NEED);
    });
    assert.strictEqual(neededAlphaLight(0, 0, 0, 0.9), 0.9);

    // Worst-block sampler on a left-black/right-white image: light text must
    // score the white block, dark text the black one, never the gray average.
    var half = new Array(16 * 16 * 4).fill(0).map(function (_, i) {
      var px = Math.floor(i / 4);
      return (i % 4 === 3) ? 255 : ((px % 16) < 8 ? 0 : 255);
    });
    assert.deepStrictEqual(extremeBlock(half, 16, 4, false), [255, 255, 255]);
    assert.deepStrictEqual(extremeBlock(half, 16, 4, true), [0, 0, 0]);
    assert.ok(neededAlpha(255, 255, 255, 0) > neededAlpha(127, 127, 127, 0));

    console.log('contrast self-check ok');
  }

  // Node: export the engine and run the check against it. No document here, so
  // this also replaces the browser bootstrap below.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      chan: chan,
      lum: lum,
      contrast: contrast,
      extremeBlock: extremeBlock,
      neededAlpha: neededAlpha,
      neededAlphaLight: neededAlphaLight
    };
    selfCheck();
    return;
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
})(typeof Drupal === 'undefined' ? null : Drupal, typeof once === 'undefined' ? null : once);
