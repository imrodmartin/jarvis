/**
 * Canvas editor: turn every "overlay opacity" number field (prop name
 * `overlay` — hero, card, one/two/three-column) into a 0-100 slider with a
 * live WCAG check. The badge samples the background image(s) rendered in the
 * preview iframe, composites the overlay at the slider value, and shows
 * ✓ when text still clears WCAG AA (4.5:1) or ✗ when it doesn't.
 *
 * Same average-color model as js/contrast.js (which auto-raises the overlay
 * on the live site): ✓ here means "your floor already passes on its own".
 * Dark overlays are scored against white text, light overlays
 * (.jarvis-bg__overlay--light) against near-black (#212529) text.
 *
 * The tray is React-rendered, so: values are written through the native
 * value setter + input/change events, the number input is hidden via a
 * data attribute (React strips classes but leaves our data-*), and a
 * MutationObserver re-enhances fields after re-renders.
 */
((Drupal, once) => {
  const NEED = 4.5;
  const DARK_TEXT_L = 0.011; // relative luminance of #212529 body text

  const chan = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

  // url -> array of per-block [r,g,b] averages (null on sampling failure).
  // 4x4 blocks of a 16x16 downsample: the badge scores the worst block, so a
  // bright patch the whole-image average would hide still fails honestly.
  const blocksCache = {};
  const sampleBlocks = (url, cb) => {
    if (url in blocksCache) { cb(blocksCache[url]); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 16;
        const cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, 16, 16);
        const d = cx.getImageData(0, 0, 16, 16).data;
        const blocks = [];
        for (let by = 0; by < 16; by += 4) {
          for (let bx = 0; bx < 16; bx += 4) {
            let r = 0; let g = 0; let b = 0; let n = 0;
            for (let y = by; y < by + 4; y++) {
              for (let x = bx; x < bx + 4; x++) {
                const i = (y * 16 + x) * 4;
                r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
              }
            }
            blocks.push([r / n, g / n, b / n]);
          }
        }
        blocksCache[url] = blocks;
      }
      catch (e) {
        blocksCache[url] = null;
      }
      cb(blocksCache[url]);
    };
    img.onerror = () => { blocksCache[url] = null; cb(null); };
    img.src = url;
  };

  // Every overlay-bearing component with a background image in the preview.
  const previewTargets = () => {
    const out = [];
    document.querySelectorAll('iframe').forEach((frame) => {
      let doc;
      try { doc = frame.contentDocument; } catch (e) { return; }
      if (!doc) return;
      doc.querySelectorAll(
        '.jarvis-hero[style*="background-image"], .jarvis-card--background[style*="background-image"], .jarvis-columns[style*="background-image"]'
      ).forEach((el) => {
        const m = (el.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
        if (!m) return;
        const ov = el.querySelector('.jarvis-hero__overlay, .jarvis-card__overlay, .jarvis-bg__overlay');
        out.push({ url: m[1], lightText: !(ov && ov.classList.contains('jarvis-bg__overlay--light')) });
      });
    });
    return out;
  };

  const ratioFor = (avg, a, lightText) => {
    if (lightText) {
      // Black overlay at alpha a scales each channel; white text on top.
      return contrast(1, lum(avg[0] * (1 - a), avg[1] * (1 - a), avg[2] * (1 - a)));
    }
    // Light overlay blends toward white; dark text on top.
    return contrast(DARK_TEXT_L, lum(
      avg[0] + (255 - avg[0]) * a,
      avg[1] + (255 - avg[1]) * a,
      avg[2] + (255 - avg[2]) * a
    ));
  };

  const updateBadge = (badge, pct) => {
    const targets = previewTargets();
    if (!targets.length) { badge.hidden = true; return; }
    let pending = targets.length;
    let worst = Infinity;
    targets.forEach((t) => sampleBlocks(t.url, (blocks) => {
      if (blocks) {
        blocks.forEach((avg) => {
          worst = Math.min(worst, ratioFor(avg, pct / 100, t.lightText));
        });
      }
      if (--pending === 0) {
        if (!Number.isFinite(worst)) { badge.hidden = true; return; }
        const pass = worst >= NEED;
        const text = `${pass ? '✓' : '✗'} ${worst.toFixed(2)}:1`;
        // Only touch the DOM on real change — scan() re-runs updates on every
        // mutation, and writing identical content would re-trigger the
        // observer in a feedback loop.
        if (badge.hidden === false && badge.textContent === text) return;
        badge.hidden = false;
        badge.textContent = text;
        badge.classList.toggle('pass', pass);
        badge.classList.toggle('fail', !pass);
        badge.title = pass
          ? Drupal.t('Text clears WCAG AA (4.5:1) at this overlay level on every background image on the page.')
          : Drupal.t('Below WCAG AA (4.5:1) on at least one background image — raise the overlay (the live site will auto-raise it, but then the design won’t match what you set here).');
      }
    }));
  };

  // Live badge refreshers, re-run on DOM changes so a badge appears once the
  // preview (and its images) finish loading, not only on slider input.
  const refreshers = new Set();

  // Canvas names prop inputs canvas_component_props[<uuid>][overlay][0][value].
  const isOverlayField = (input) =>
    input.type === 'number'
    && (input.name === 'overlay' || /\[overlay\]($|\[)/.test(input.name || ''));

  const enhance = (num) => {
    num.setAttribute('data-jarvis-overlay-hidden', '');

    const wrap = document.createElement('div');
    wrap.className = 'jarvis-overlay-slider';

    const range = document.createElement('input');
    range.type = 'range';
    range.min = 0;
    range.max = 100;
    range.step = 1;
    range.value = num.value === '' ? 40 : num.value;
    range.setAttribute('aria-label', Drupal.t('Overlay opacity (%)'));

    const readout = document.createElement('span');
    readout.className = 'jarvis-overlay-readout';
    readout.textContent = `${range.value}%`;

    const badge = document.createElement('span');
    badge.className = 'jarvis-overlay-badge';
    badge.hidden = true;

    wrap.append(range, readout, badge);
    num.insertAdjacentElement('afterend', wrap);

    range.addEventListener('input', () => {
      readout.textContent = `${range.value}%`;
      setValue.call(num, range.value);
      num.dispatchEvent(new Event('input', { bubbles: true }));
      num.dispatchEvent(new Event('change', { bubbles: true }));
      updateBadge(badge, Number(range.value));
    });
    // External updates (undo, server round-trip) flow back to the slider.
    num.addEventListener('input', () => {
      if (num.value !== '' && num.value !== range.value) {
        range.value = num.value;
        readout.textContent = `${range.value}%`;
        updateBadge(badge, Number(range.value));
      }
    });

    const refresh = () => {
      if (!badge.isConnected) { refreshers.delete(refresh); return; }
      updateBadge(badge, Number(range.value));
    };
    refreshers.add(refresh);
    updateBadge(badge, Number(range.value));
  };

  const scan = () => {
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      if (isOverlayField(input) && once('jarvis-overlay', input).length) enhance(input);
    });
    refreshers.forEach((refresh) => refresh());
  };

  Drupal.behaviors.jarvisCanvasOverlay = {
    attach() {
      once('jarvis-overlay-observer', 'body').forEach(() => {
        // setTimeout, not requestAnimationFrame — rAF stalls in background
        // tabs and the debounce flag would jam permanently.
        let queued = false;
        new MutationObserver(() => {
          if (queued) return;
          queued = true;
          setTimeout(() => { queued = false; scan(); }, 50);
        }).observe(document.body, { childList: true, subtree: true });
        scan();
      });
    },
  };
})(Drupal, once);
