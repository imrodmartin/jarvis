/**
 * @file
 * Shared WCAG contrast engine for the hero and card components: auto-darkens
 * the black overlay until light text passes WCAG AA (4.5:1) on the sampled
 * background image. Attached per component via libraryOverrides dependencies
 * (jarvis/contrast) in hero.component.yml and card.component.yml.
 */
(function () {
  'use strict';

  var NEED = 4.5;   // WCAG AA, normal text (subheading/body is the tightest case)
  var TEXT = 1;     // relative luminance of #fff text

  // [container selector, overlay selector, dark-text class] per component.
  // Auto-darkening assumes light text; dark text is handled by each
  // component's black CSS fallback region instead.
  var TARGETS = [
    ['.jarvis-hero[style*="background-image"]', '.jarvis-hero__overlay', 'jarvis-hero--text-dark'],
    ['.jarvis-card--background[style*="background-image"]', '.jarvis-card__overlay', 'jarvis-card--text-dark']
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

  // Average [r,g,b] of the brightest bs×bs block in a size×size RGBA sample.
  // Blocks (not single pixels) so one noisy pixel can't dominate.
  function brightestBlock(d, size, bs) {
    var best = [0, 0, 0];
    var bestLum = -1;
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
        if (l > bestLum) { bestLum = l; best = [r, g, b]; }
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

  function tune(el, overlaySel, darkClass) {
    if (el.dataset.jarvisContrast) return;
    el.dataset.jarvisContrast = '1';
    // Dark AND black text sit on the bare image — skip auto-darkening for both.
    var blackClass = darkClass.replace('--text-dark', '--text-black');
    if (el.classList.contains(darkClass) || el.classList.contains(blackClass)) return;
    var overlay = el.querySelector(overlaySel);
    if (!overlay) return;
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
        // Score against the brightest 4x4 block, not the whole-image average:
        // text can cross a bright patch that an average would hide.
        var best = brightestBlock(d, 16, 4);
        overlay.style.opacity = neededAlpha(best[0], best[1], best[2], floor).toFixed(2);
      } catch (e) {
        // Cross-origin image taints the canvas -> can't sample. Fail safe: force dark.
        overlay.style.opacity = Math.max(floor, 0.6).toFixed(2);
      }
    };
    img.src = m[1];
  }

  function run() {
    TARGETS.forEach(function (t) {
      var els = document.querySelectorAll(t[0]);
      for (var i = 0; i < els.length; i++) tune(els[i], t[1], t[2]);
    });
  }

  if (typeof document === 'undefined') return;  // node self-check path
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

// ponytail: node self-check for the contrast math. `node contrast.js` runs it; browser skips.
if (typeof module !== 'undefined' && module.exports) {
  var chan = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  var lum = function (r, g, b) { return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b); };
  var contrast = function (a, b) { return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  var need = function (r, g, b, f) { var a = f; while (a < 0.95) { if (contrast(1, lum(r * (1 - a), g * (1 - a), b * (1 - a))) >= 4.5) break; a += 0.02; } return a; };
  var assert = require('assert');
  assert.strictEqual(Math.round(contrast(1, lum(0, 0, 0))), 21);   // white on black = 21:1
  assert.ok(contrast(1, lum(255, 255, 255)) === 1);                // white on white = 1:1
  assert.ok(need(0, 0, 0, 0) === 0);                               // black image needs none
  [[255, 255, 255], [230, 225, 210], [200, 180, 150]].forEach(function (c) {
    var a = need(c[0], c[1], c[2], 0);                             // light images -> darkened until text passes
    assert.ok(a > 0);
    assert.ok(contrast(1, lum(c[0] * (1 - a), c[1] * (1 - a), c[2] * (1 - a))) >= 4.5);
  });
  assert.ok(need(230, 225, 210, 0.8) === 0.8);                     // respects user floor when already dark enough
  // Brightest-block: half-black/half-white sample must resolve to the white
  // block, not the mid-gray average.
  var bb = function (d, size, bs) {
    var best = [0, 0, 0], bestLum = -1;
    for (var by = 0; by < size; by += bs) for (var bx = 0; bx < size; bx += bs) {
      var r = 0, g = 0, b = 0, n = 0;
      for (var y = by; y < by + bs; y++) for (var x = bx; x < bx + bs; x++) {
        var i = (y * size + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
      r /= n; g /= n; b /= n;
      var l = lum(r, g, b);
      if (l > bestLum) { bestLum = l; best = [r, g, b]; }
    }
    return best;
  };
  var half = new Array(16 * 16 * 4).fill(0).map(function (_, i) {
    var px = Math.floor(i / 4);
    return (i % 4 === 3) ? 255 : ((px % 16) < 8 ? 0 : 255);        // left half black, right half white
  });
  var picked = bb(half, 16, 4);
  assert.deepStrictEqual(picked, [255, 255, 255]);
  assert.ok(need(picked[0], picked[1], picked[2], 0) > need(127, 127, 127, 0)); // stricter than the average
  console.log('contrast self-check ok');
}
