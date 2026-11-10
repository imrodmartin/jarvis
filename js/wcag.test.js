/**
 * @file
 * Node self-check for wcag.js: `node js/wcag.test.js`.
 *
 * Requires the REAL wcag.js module — not copies of its functions, which is how
 * an earlier version of this check passed while the real solver was wrong.
 * Lives in its own file so the assertions don't ship to the browser (wcag.js
 * loads on every page with a hero/card/columns component).
 */

'use strict';

const assert = require('assert');
const w = require('./wcag.js');
const { NEED, TEXT, DARK_TEXT, lum, contrast, rgbFromHex, ratioHex, blocks, darken, lighten } = w;

// Primitives.
// Pin DARK_TEXT to the true WCAG luminance of #212529 — a hand-copied 0.011
// shipped once and every light overlay stopped raising short of AA.
assert.ok(Math.abs(DARK_TEXT - 0.01807) < 1e-4);
assert.strictEqual(Math.round(contrast(TEXT, lum(0, 0, 0))), 21);  // white on black
assert.strictEqual(contrast(TEXT, lum(255, 255, 255)), 1);         // white on white
assert.deepStrictEqual(rgbFromHex('#2d6cdf'), [45, 108, 223]);
assert.strictEqual(Math.round(ratioHex('#ffffff', '#000000')), 21);
// Symmetric — which is why the settings form lists each pair only once.
assert.strictEqual(ratioHex('#2d6cdf', '#ffffff'), ratioHex('#ffffff', '#2d6cdf'));

// Overlay maths the editor badge composes: a black overlay at alpha 1 is black,
// a white one is white, and each clears AA for its text colour.
assert.deepStrictEqual(darken([200, 180, 150], 1), [0, 0, 0]);
assert.deepStrictEqual(lighten([40, 40, 60], 1), [255, 255, 255]);
assert.ok(contrast(TEXT, lum(...darken([255, 255, 255], 0.8))) >= NEED);
assert.ok(contrast(DARK_TEXT, lum(...lighten([0, 0, 0], 0.9))) >= NEED);

// Block sampler on a left-black/right-white image: it must return the pure
// blocks, never one grey average. The worst-block solver itself now runs
// server-side (jarvis_canvas OverlayAlpha); the editor badge scores every
// block this returns.
const half = new Array(16 * 16 * 4).fill(0).map(function (_, i) {
  const px = Math.floor(i / 4);
  return (i % 4 === 3) ? 255 : ((px % 16) < 8 ? 0 : 255);
});
const sampled = blocks(half, 16, 4);
assert.strictEqual(sampled.length, 16);
assert.deepStrictEqual(sampled[0], [0, 0, 0]);
assert.deepStrictEqual(sampled[3], [255, 255, 255]);

console.log('wcag self-check ok');
