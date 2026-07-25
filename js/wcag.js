/**
 * @file
 * The theme's single WCAG contrast engine.
 *
 * The sRGB->linear conversion, the relative-luminance coefficients, the
 * contrast formula, the 16x16/4x4 worst-block sampler and the two overlay
 * solvers used to exist as three separate copies — contrast.js (live site),
 * canvas-overlay.js (editor badge) and color-settings.js (theme-settings
 * badges) — plus twice more in PHP. Fixing a threshold or rounding decision
 * meant finding all of them, and they had already drifted (`Math.pow` vs `**`,
 * hex input vs channel input).
 *
 * Browser: attaches to window.jarvisWcag via the jarvis/wcag library.
 * Node: `node js/wcag.js` runs the self-check at the bottom against these very
 * functions — not against copies, which is how an earlier version of that check
 * passed while the real solver was wrong.
 */
(function (root) {
  'use strict';

  // WCAG AA for normal text. Subheading/body is the tightest case on these
  // components, so everything is scored against it.
  var NEED = 4.5;
  // Relative luminance of #fff text.
  var TEXT = 1;
  // Relative luminance of #212529 body text.
  var DARK_TEXT = 0.011;

  /**
   * sRGB channel (0-255) -> linear.
   */
  function chan(c) {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /**
   * Relative luminance from 0-255 channels.
   */
  function lum(r, g, b) {
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  }

  /**
   * Contrast ratio between two relative luminances.
   */
  function contrast(l1, l2) {
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /**
   * '#rrggbb' -> [r, g, b].
   */
  function rgbFromHex(hex) {
    return [1, 3, 5].map(function (i) {
      return parseInt(hex.slice(i, i + 2), 16);
    });
  }

  /**
   * Relative luminance of a '#rrggbb' string.
   */
  function lumHex(hex) {
    var c = rgbFromHex(hex);
    return lum(c[0], c[1], c[2]);
  }

  /**
   * Contrast ratio between two '#rrggbb' strings.
   */
  function ratioHex(a, b) {
    return contrast(lumHex(a), lumHex(b));
  }

  /**
   * Per-block [r,g,b] averages of a size x size RGBA sample.
   *
   * Blocks rather than single pixels so one noisy pixel cannot dominate, and
   * blocks rather than a whole-image average so a bright patch the average
   * would hide still fails honestly.
   */
  function blocks(d, size, bs) {
    var out = [];
    for (var by = 0; by < size; by += bs) {
      for (var bx = 0; bx < size; bx += bs) {
        var r = 0, g = 0, b = 0, n = 0;
        for (var y = by; y < by + bs; y++) {
          for (var x = bx; x < bx + bs; x++) {
            var i = (y * size + x) * 4;
            r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
          }
        }
        out.push([r / n, g / n, b / n]);
      }
    }
    return out;
  }

  /**
   * Worst-case block: brightest for light text, darkest for dark text.
   */
  function extremeBlock(d, size, bs, darkest) {
    var best = [0, 0, 0];
    var bestLum = darkest ? 2 : -1;
    blocks(d, size, bs).forEach(function (c) {
      var l = lum(c[0], c[1], c[2]);
      if (darkest ? l < bestLum : l > bestLum) { bestLum = l; best = c; }
    });
    return best;
  }

  /**
   * A black overlay at alpha `a` scales each sRGB channel by (1 - a).
   */
  function darken(c, a) {
    return [c[0] * (1 - a), c[1] * (1 - a), c[2] * (1 - a)];
  }

  /**
   * A white overlay at alpha `a` blends each channel toward 255.
   */
  function lighten(c, a) {
    return [c[0] + (255 - c[0]) * a, c[1] + (255 - c[1]) * a, c[2] + (255 - c[2]) * a];
  }

  /**
   * Smallest black-overlay alpha (>= floor) that makes white text pass.
   */
  function neededAlpha(r, g, b, floor) {
    var a = floor;
    while (a < 0.95) {
      var c = darken([r, g, b], a);
      if (contrast(TEXT, lum(c[0], c[1], c[2])) >= NEED) break;
      a += 0.02;
    }
    return a;
  }

  /**
   * Smallest white-overlay alpha (>= floor) that makes dark text pass.
   */
  function neededAlphaLight(r, g, b, floor) {
    var a = floor;
    while (a < 0.95) {
      var c = lighten([r, g, b], a);
      if (contrast(DARK_TEXT, lum(c[0], c[1], c[2])) >= NEED) break;
      a += 0.02;
    }
    return a;
  }

  var api = {
    NEED: NEED,
    TEXT: TEXT,
    DARK_TEXT: DARK_TEXT,
    chan: chan,
    lum: lum,
    contrast: contrast,
    rgbFromHex: rgbFromHex,
    lumHex: lumHex,
    ratioHex: ratioHex,
    blocks: blocks,
    extremeBlock: extremeBlock,
    darken: darken,
    lighten: lighten,
    neededAlpha: neededAlpha,
    neededAlphaLight: neededAlphaLight
  };

  // ponytail: node self-check. `node js/wcag.js` runs it; the browser skips it.
  // It exercises the SAME functions exported above.
  function selfCheck() {
    var assert = require('assert');

    // Primitives.
    assert.strictEqual(Math.round(contrast(TEXT, lum(0, 0, 0))), 21);  // white on black
    assert.strictEqual(contrast(TEXT, lum(255, 255, 255)), 1);         // white on white
    assert.deepStrictEqual(rgbFromHex('#2d6cdf'), [45, 108, 223]);
    assert.strictEqual(Math.round(ratioHex('#ffffff', '#000000')), 21);
    // Symmetric — which is why the settings form lists each pair only once.
    assert.strictEqual(ratioHex('#2d6cdf', '#ffffff'), ratioHex('#ffffff', '#2d6cdf'));

    // Dark-overlay solver.
    assert.strictEqual(neededAlpha(0, 0, 0, 0), 0);
    [[255, 255, 255], [230, 225, 210], [200, 180, 150]].forEach(function (c) {
      var a = neededAlpha(c[0], c[1], c[2], 0);
      assert.ok(a > 0);
      var o = darken(c, a);
      assert.ok(contrast(TEXT, lum(o[0], o[1], o[2])) >= NEED);
    });
    assert.strictEqual(neededAlpha(230, 225, 210, 0.8), 0.8);

    // Light-overlay solver: mirror of the above.
    assert.strictEqual(neededAlphaLight(255, 255, 255, 0), 0);
    [[0, 0, 0], [40, 40, 60], [90, 70, 50]].forEach(function (c) {
      var a = neededAlphaLight(c[0], c[1], c[2], 0);
      assert.ok(a > 0);
      var o = lighten(c, a);
      assert.ok(contrast(DARK_TEXT, lum(o[0], o[1], o[2])) >= NEED);
    });
    assert.strictEqual(neededAlphaLight(0, 0, 0, 0.9), 0.9);

    // Worst-block sampler on a left-black/right-white image: light text must
    // score the white block, dark text the black one, never the grey average.
    var half = new Array(16 * 16 * 4).fill(0).map(function (_, i) {
      var px = Math.floor(i / 4);
      return (i % 4 === 3) ? 255 : ((px % 16) < 8 ? 0 : 255);
    });
    assert.strictEqual(blocks(half, 16, 4).length, 16);
    assert.deepStrictEqual(extremeBlock(half, 16, 4, false), [255, 255, 255]);
    assert.deepStrictEqual(extremeBlock(half, 16, 4, true), [0, 0, 0]);
    assert.ok(neededAlpha(255, 255, 255, 0) > neededAlpha(127, 127, 127, 0));

    console.log('wcag self-check ok');
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    selfCheck();
    return;
  }
  root.jarvisWcag = api;
})(typeof window === 'undefined' ? this : window);
