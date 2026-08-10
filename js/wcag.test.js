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
const { NEED, TEXT, DARK_TEXT, lum, contrast, rgbFromHex, ratioHex, blocks, extremeBlock, darken, lighten, neededAlpha, neededAlphaLight } = w;

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

// Dark-overlay solver.
assert.strictEqual(neededAlpha(0, 0, 0, 0), 0);
[[255, 255, 255], [230, 225, 210], [200, 180, 150]].forEach(function (c) {
  const a = neededAlpha(c[0], c[1], c[2], 0);
  assert.ok(a > 0);
  const o = darken(c, a);
  assert.ok(contrast(TEXT, lum(o[0], o[1], o[2])) >= NEED);
});
assert.strictEqual(neededAlpha(230, 225, 210, 0.8), 0.8);

// Light-overlay solver: mirror of the above.
assert.strictEqual(neededAlphaLight(255, 255, 255, 0), 0);
[[0, 0, 0], [40, 40, 60], [90, 70, 50]].forEach(function (c) {
  const a = neededAlphaLight(c[0], c[1], c[2], 0);
  assert.ok(a > 0);
  const o = lighten(c, a);
  assert.ok(contrast(DARK_TEXT, lum(o[0], o[1], o[2])) >= NEED);
});
assert.strictEqual(neededAlphaLight(0, 0, 0, 0.9), 0.9);

// Worst-block sampler on a left-black/right-white image: light text must
// score the white block, dark text the black one, never the grey average.
const half = new Array(16 * 16 * 4).fill(0).map(function (_, i) {
  const px = Math.floor(i / 4);
  return (i % 4 === 3) ? 255 : ((px % 16) < 8 ? 0 : 255);
});
assert.strictEqual(blocks(half, 16, 4).length, 16);
assert.deepStrictEqual(extremeBlock(half, 16, 4, false), [255, 255, 255]);
assert.deepStrictEqual(extremeBlock(half, 16, 4, true), [0, 0, 0]);
assert.ok(neededAlpha(255, 255, 255, 0) > neededAlpha(127, 127, 127, 0));

console.log('wcag self-check ok');
