/**
 * Canvas editor: turn every "overlay opacity" number field (prop name
 * `overlay` — hero, card, one/two/three-column) into a 0-100 slider with a
 * live WCAG check. Hero's `box_opacity` (text card opacity) gets the slider and
 * the check too; Video Background's and the custom-columns width_* props get
 * the slider alone. The badge samples the background image(s) rendered in the
 * preview iframe, composites the overlay at the slider value, and shows
 * ✓ when text still clears WCAG AA (4.5:1) or ✗ when it doesn't.
 *
 * A hero with its text card on is scored on its own photo with BOTH layers
 * applied — the overlay and the card — since that is what the text sits on.
 *
 * Same block model as OverlayAlpha.php in jarvis_canvas, which raises the
 * overlay (or the hero card) on the live site: ✓ here means "your settings
 * already pass on their own", ✗ means the site will raise them for you.
 * Dark overlays are scored against white text, light overlays
 * (.jarvis-bg__overlay--light) against near-black (#212529) text.
 *
 * The tray is React-rendered, so: values are written through the native
 * value setter + input/change events, the number input is hidden via a
 * data attribute (React strips classes but leaves our data-*), and a
 * MutationObserver re-enhances fields after re-renders.
 */
((Drupal, once, wcag) => {
  // Shared engine — see js/wcag.js, attached via the jarvis/wcag dependency.
  const { NEED, DARK_TEXT: DARK_TEXT_L, lum, contrast, darken, lighten } = wcag;
  // Aliased: `blocks` is also used as a callback parameter further down.
  const blockAverages = wcag.blocks;

  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

  // url -> array of per-block [r,g,b] averages (null on sampling failure).
  // 4px blocks of a 64px downsample, the same grid OverlayAlpha.php scores on
  // the server (SAMPLE / BLOCK there). It was 16px with 4px blocks, which made
  // each block a quarter of the photo's width and averaged bright patches
  // away: the badge showed a pass well below the level the site then raised
  // the layer to.
  const SAMPLE = 64;
  const BLOCK = 4;
  const blocksCache = {};
  const sampleBlocks = (url, cb) => {
    if (url in blocksCache) { cb(blocksCache[url]); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = cv.height = SAMPLE;
        const cx = cv.getContext('2d');
        // White first, as the server does: a transparent PNG would otherwise
        // sample as black.
        cx.fillStyle = '#fff';
        cx.fillRect(0, 0, SAMPLE, SAMPLE);
        cx.imageSmoothingQuality = 'high';
        cx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const d = cx.getImageData(0, 0, SAMPLE, SAMPLE).data;
        blocksCache[url] = blockAverages(d, SAMPLE, BLOCK);
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
        // A hero with a text card is left out of this page-wide sample: its
        // text sits on the card, so the overlay alone does not decide its
        // contrast. It is scored on its own, by cardedHero().
        '.jarvis-hero[style*="background-image"]:not(.jarvis-hero--card), .jarvis-card--background[style*="background-image"], .jarvis-columns[style*="background-image"]'
      ).forEach((el) => {
        const m = imageUrl(el);
        if (!m) return;
        const ov = el.querySelector('.jarvis-bg__overlay');
        out.push({ url: m[1], lightText: !(ov && ov.classList.contains('jarvis-bg__overlay--light')) });
      });
    });
    return out;
  };

  const imageUrl = (el) => ((el && el.style.backgroundImage) || '').match(/url\(["']?(.*?)["']?\)/);

  // The component a prop input belongs to, read off its Canvas field name.
  // Probe order is load-bearing: among the overlay-bearing components `layout`
  // is unique to card, but `heading_level` is on BOTH card and hero, so card
  // must be tested first. The column layouts have neither prop.
  const formOf = (input) => {
    const uuid = ((input.name || '').match(/canvas_component_props\[([^\]]+)\]/) || [])[1];
    const sibling = (prop) => (uuid
      ? document.querySelector(`[name*="${uuid}"][name*="${prop}"]`)
      : null);
    const isCard = !!sibling('layout');
    const isHero = !isCard && !!sibling('heading_level');
    return { uuid, sibling, isCard, isHero };
  };

  // One component's root element in the preview. Canvas tags it with
  // data-canvas-uuid in the live frame; the second frame it keeps for swapping
  // only carries the canvas-start comment, so that is the fallback.
  const componentRoot = (uuid) => {
    const docs = [];
    document.querySelectorAll('iframe').forEach((frame) => {
      try { if (frame.contentDocument && frame.contentDocument.body) docs.push(frame.contentDocument); } catch (e) { /* cross-origin frame */ }
    });
    for (const doc of docs) {
      const el = doc.querySelector(`[data-canvas-uuid="${uuid}"]`);
      if (el) return el;
    }
    for (const doc of docs) {
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
      while (walker.nextNode()) {
        if (walker.currentNode.nodeValue.trim() === `canvas-start-${uuid}`) {
          return walker.currentNode.nextElementSibling;
        }
      }
    }
    return null;
  };

  // A hero with its text card on, as the form has it right now, or null.
  //
  // The text sits on the card, the card on the overlay, the overlay on the
  // photo, and both layers are the same colour (black under white text, white
  // under black), so together they cover 1 - (1 - overlay)(1 - card) of it:
  // the sum hero.twig does server-side. Scored against this hero's own photo,
  // not every image on the page — the two sliders belong to this hero alone.
  const cardedHero = (form) => {
    if (!form.isHero) return null;
    const select = form.sibling('[box_background]');
    if (!select || !select.value || select.value === 'none') return null;
    // An empty field means hero.twig's own default: 40 and 85.
    const level = (prop, empty) => {
      const el = form.sibling(`[${prop}]`);
      return (el && el.value !== '' ? Number(el.value) : empty) / 100;
    };
    const m = imageUrl(componentRoot(form.uuid));
    return {
      pct: (1 - (1 - level('overlay', 40)) * (1 - level('box_opacity', 85))) * 100,
      // No photo, no badge: the text is then on the hero's own solid colour.
      targets: m ? [{ url: m[1], lightText: select.value !== 'light' }] : [],
      pass: Drupal.t('Text clears WCAG AA (4.5:1) on this photo with the overlay and the text card at these levels.'),
      fail: Drupal.t('Below WCAG AA (4.5:1) on this photo with the overlay and the text card at these levels — raise either one (the live site will auto-raise the card, but then the design won’t match what you set here).'),
    };
  };

  const ratioFor = (avg, a, lightText) => {
    if (lightText) {
      // Black overlay at alpha a scales each channel; white text on top.
      return contrast(1, lum(...darken(avg, a)));
    }
    // Light overlay blends toward white; dark text on top.
    return contrast(DARK_TEXT_L, lum(...lighten(avg, a)));
  };

  const PAGE_PASS = Drupal.t('Text clears WCAG AA (4.5:1) at this overlay level on every background image on the page.');
  const PAGE_FAIL = Drupal.t('Below WCAG AA (4.5:1) on at least one background image — raise the overlay (the live site will auto-raise it, but then the design won’t match what you set here).');

  // job is what to score: { pct, targets, pass, fail }, or null for no badge.
  // Sampling is async, so each call takes a ticket and a result that lands
  // after a newer call has started is dropped.
  const tickets = new WeakMap();
  const updateBadge = (badge, job) => {
    const ticket = (tickets.get(badge) || 0) + 1;
    tickets.set(badge, ticket);
    if (!job || !job.targets.length) { badge.hidden = true; return; }
    const { pct, targets } = job;
    let pending = targets.length;
    let worst = Infinity;
    targets.forEach((t) => sampleBlocks(t.url, (blocks) => {
      if (blocks) {
        blocks.forEach((avg) => {
          worst = Math.min(worst, ratioFor(avg, pct / 100, t.lightText));
        });
      }
      if (--pending === 0) {
        if (tickets.get(badge) !== ticket) return;
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
        badge.title = pass ? job.pass : job.fail;
      }
    }));
  };

  // Live badge refreshers, re-run on DOM changes so a badge appears once the
  // preview (and its images) finish loading, not only on slider input.
  const refreshers = new Set();
  const refreshAll = () => refreshers.forEach((refresh) => refresh());

  // A badge that re-scores itself: whenever anything on the page might have
  // changed its answer, until it leaves the DOM.
  const liveBadge = (wrap, job) => {
    const badge = document.createElement('span');
    badge.className = 'jarvis-overlay-badge';
    badge.hidden = true;
    wrap.append(badge);
    const refresh = () => {
      if (!badge.isConnected) { refreshers.delete(refresh); return; }
      updateBadge(badge, job());
    };
    refreshers.add(refresh);
    refresh();
  };

  // Canvas names prop inputs canvas_component_props[<uuid>][overlay][0][value].
  const isOverlayField = (input) =>
    input.type === 'number'
    && (input.name === 'overlay' || /\[overlay\]($|\[)/.test(input.name || ''));

  // Text card opacity: hero's and Video Background's.
  const isBoxOpacityField = (input) =>
    input.type === 'number'
    && (input.name === 'box_opacity' || /\[box_opacity\]($|\[)/.test(input.name || ''));

  // 3 Columns (custom widths): width_first/second/third, empty = Twig default.
  // Snaps to 5% steps: exact values like 33 are fiddly to hit, and the Twig
  // scales the three to 100% anyway.
  const COLUMN_WIDTHS = { width_first: 25, width_second: 50, width_third: 25 };
  const columnWidthProp = (input) => input.type === 'number'
    && Object.keys(COLUMN_WIDTHS).find((p) =>
      input.name === p || new RegExp(`\\[${p}\\]($|\\[)`).test(input.name || ''));

  // onChange(value) fires after every slider move and every external update.
  const plainSlider = (num, emptyDefault, label, step = 1, onChange = () => {}) => {
    num.setAttribute('data-jarvis-overlay-hidden', '');
    const wrap = document.createElement('div');
    wrap.className = 'jarvis-overlay-slider';
    const range = document.createElement('input');
    range.type = 'range';
    range.min = 0;
    range.max = 100;
    range.step = step;
    range.value = num.value === '' ? emptyDefault : num.value;
    range.setAttribute('aria-label', label);
    const readout = document.createElement('span');
    readout.className = 'jarvis-overlay-readout';
    readout.textContent = `${range.value}%`;
    wrap.append(range, readout);
    num.insertAdjacentElement('afterend', wrap);
    range.addEventListener('input', () => {
      readout.textContent = `${range.value}%`;
      setValue.call(num, range.value);
      num.dispatchEvent(new Event('input', { bubbles: true }));
      num.dispatchEvent(new Event('change', { bubbles: true }));
      onChange(Number(range.value));
    });
    // External updates (undo, server round-trip) flow back to the slider.
    num.addEventListener('input', () => {
      if (num.value !== '' && num.value !== range.value) {
        range.value = num.value;
        readout.textContent = `${range.value}%`;
        onChange(Number(range.value));
      }
    });
    return { wrap, range };
  };

  const enhance = (num) => {
    const form = formOf(num);
    const { sibling, isCard, isHero } = form;

    // Video Background. `box_opacity` is shared with hero (its text card), so
    // the form is identified by having it without being a hero.
    //
    // Its dimming gets a slider but NO badge, because neither state of the
    // component is something this badge can score honestly:
    //
    // - With a text card (box_background != 'none', the default) the text sits
    //   on the card, not on the video, and video-background.twig paints the
    //   card colour in a separate __card-bg layer so box_opacity never fades
    //   the text. The card's `jarvis-bg--*` class carries a paired --jarvis-on
    //   text colour that is already AA against it, so the dimming level simply
    //   does not decide the text's contrast.
    // - Bare (box_background: 'none') the text does sit on the dimmed video,
    //   but scoring that would mean sampling video frames, which sampleBlocks()
    //   cannot do — it reads still images.
    //
    // Until that happened the badge scored previewTargets(), which matches only
    // hero/card/columns background IMAGES, so on a page with any of those it
    // reported a ratio belonging to a different component: a confident ✗ on a
    // card that actually passes comfortably. A wrong fail is worse than none.
    if (sibling('box_opacity') && !isHero) {
      // video-background.twig defaults an empty overlay to 30.
      plainSlider(num, 30, Drupal.t('Background dimming (%)'));
      return;
    }

    // An empty field means the SDC's own |default() applies at render time.
    // card.twig and hero.twig default to 40, the column layouts to 45 — seeding
    // a flat 40 made the slider and the WCAG badge disagree with what a column
    // actually renders.
    const emptyDefault = (isCard || isHero) ? 40 : 45;

    // The badge follows the slider. Dark text used to disable the slider here,
    // from when card and hero zeroed the overlay for it; both now render a
    // light overlay instead, so the control stays live for every text colour.
    //
    // refreshAll, not just this badge: on a hero with a text card this slider
    // and the card's share one answer, so moving either must update both.
    const { wrap, range } = plainSlider(num, emptyDefault, Drupal.t('Overlay opacity (%)'), 1, refreshAll);
    liveBadge(wrap, () => cardedHero(form) || {
      pct: Number(range.value),
      targets: previewTargets(),
      pass: PAGE_PASS,
      fail: PAGE_FAIL,
    });
  };

  const scan = () => {
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      if (isOverlayField(input) && once('jarvis-overlay', input).length) enhance(input);
      // video-background.twig and hero.twig both default an empty box_opacity
      // to 85. Hero's card gets the same combined badge as its overlay slider,
      // shown only while the card is on. Video Background's gets none — see
      // the note in enhance().
      if (isBoxOpacityField(input) && once('jarvis-overlay', input).length) {
        const form = formOf(input);
        const { wrap } = plainSlider(input, 85, Drupal.t('Text card opacity (%)'), 1, refreshAll);
        if (form.isHero) liveBadge(wrap, () => cardedHero(form));
      }
      const widthProp = columnWidthProp(input);
      if (widthProp && once('jarvis-overlay', input).length) {
        plainSlider(input, COLUMN_WIDTHS[widthProp], Drupal.t('Column @n width (%)', {
          '@n': Object.keys(COLUMN_WIDTHS).indexOf(widthProp) + 1,
        }), 5);
      }
    });
    refreshAll();
  };

  // Only mutations that could introduce or remove an overlay field are worth a
  // scan. Observing all of <body> meant every keystroke in a CKEditor field
  // inside the tray re-ran scan() at the 50ms ceiling for the life of the page,
  // and each run walked every iframe looking for preview targets.
  const RELEVANT = (records) => records.some((r) =>
    [...r.addedNodes, ...r.removedNodes].some((n) =>
      n.nodeType === 1
      && (n.matches?.('input[type="number"], form, [data-testid]')
        || n.querySelector?.('input[type="number"]'))));

  Drupal.behaviors.jarvisCanvasOverlay = {
    attach() {
      once('jarvis-overlay-observer', 'body').forEach(() => {
        // Switching a hero's text card on or off changes what its badges
        // score. Delegated, because React may swap the <select> for a new node.
        document.addEventListener('change', (e) => {
          if (/\[box_background\]/.test((e.target && e.target.name) || '')) refreshAll();
        });

        // The settings tray is where prop forms live. Fall back to body only if
        // the tray is not in the DOM yet, and re-target once it appears.
        const target = () =>
          document.querySelector('[data-testid="canvas-contextual-panel"]')
          || document.querySelector('.canvas-settings-tray')
          || document.body;

        // setTimeout, not requestAnimationFrame — rAF stalls in background
        // tabs and the debounce flag would jam permanently.
        let queued = false;
        const observer = new MutationObserver((records) => {
          if (queued || !RELEVANT(records)) return;
          queued = true;
          setTimeout(() => { queued = false; scan(); }, 50);
        });
        let observed = target();
        observer.observe(observed, { childList: true, subtree: true });

        // React can replace the tray wholesale; if that happens, move the
        // observer onto the new node rather than watching a detached one.
        if (observed === document.body) {
          const retarget = setInterval(() => {
            const next = target();
            if (next !== document.body && next !== observed) {
              observer.disconnect();
              observed = next;
              observer.observe(observed, { childList: true, subtree: true });
              clearInterval(retarget);
              scan();
            }
          }, 1000);
        }
        scan();
      });
    },
  };
})(Drupal, once, window.jarvisWcag);
