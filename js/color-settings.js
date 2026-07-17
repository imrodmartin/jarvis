/**
 * Theme-settings color widgets:
 * - Two-way sync between each hex textfield and its native color picker (the
 *   picker doubles as the live sample swatch).
 * - Live WCAG contrast badges for the fg/bg pairs supplied in
 *   drupalSettings.jarvisContrastPairs. Each badge shows the ratio, pass/fail
 *   for small text (AA 4.5:1) and large text (AA 3:1), and a one-click
 *   suggestion when small text fails.
 */
((Drupal, drupalSettings, once) => {
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const SMALL = 4.5;
  const LARGE = 3;

  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const toHex = (c) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

  const luminance = (hex) => {
    const [r, g, b] = rgb(hex).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const ratio = (a, b) => {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  // Nearest fg that reaches `target` against bg: blend fg toward black and
  // toward white in 5% steps, return the first (least-changed) one that passes.
  // Optional `ok` predicate lets callers add extra constraints (e.g. the
  // suggestion must also stay legible on a shared background).
  const suggest = (fg, bg, target, ok) => {
    const base = rgb(fg);
    const mix = (to, p) => toHex(base.map((v) => Math.round(v * (1 - p) + to * p)));
    for (let p = 0.05; p <= 1.001; p += 0.05) {
      const hits = [mix(255, p), mix(0, p)]
        .filter((c) => ratio(c, bg) >= target && (!ok || ok(c)));
      if (hits.length) {
        return hits.sort((a, b2) => ratio(b2, bg) - ratio(a, bg))[0];
      }
    }
    return null;
  };

  Drupal.behaviors.jarvisColorSettings = {
    attach(context) {
      once('jarvis-color', '.jarvis-color-hex', context).forEach((hex) => {
        const wrap = hex.closest('.form-item') || hex.parentNode;
        const pick = wrap.querySelector('.jarvis-color-pick');
        if (!pick) return;
        // Picker -> hex box; bubble input so contrast badges recompute.
        pick.addEventListener('input', () => {
          hex.value = pick.value;
          hex.dispatchEvent(new Event('input', { bubbles: true }));
        });
        // Hex box -> picker/swatch, only once it's a full 6-digit hex.
        hex.addEventListener('input', () => {
          if (HEX.test(hex.value)) pick.value = hex.value;
        });
      });

      // Contrast badges, one per fg/bg pair, attached under the fg field.
      (drupalSettings.jarvisContrastPairs || []).forEach((pair) => {
        const fg = document.querySelector(`input[name="${pair.fg}"]`);
        const bg = document.querySelector(`input[name="${pair.bg}"]`);
        if (!fg || !bg || !once('jarvis-contrast-' + pair.bg, fg).length) return;

        const badge = document.createElement('div');
        badge.className = 'jarvis-contrast';
        (fg.closest('.form-item') || fg.parentNode).appendChild(badge);

        const chip = (label, need, r) =>
          `<span class="jarvis-contrast-chip ${r >= need ? 'pass' : 'fail'}">${label} (${need}:1) ${r >= need ? '✓' : '✗'}</span>`;

        // WCAG 1.4.1 pairs compare link color to the surrounding TEXT color
        // (3:1 to be distinguishable without an underline); 'ref' is the
        // shared background, so suggestions stay legible on it too.
        const isDistinguish = pair.type === 'distinguish';
        const ref = pair.ref ? document.querySelector(`input[name="${pair.ref}"]`) : null;

        const fixButton = (fix) =>
          `<button type="button" class="jarvis-contrast-fix" data-fix="${fix}">`
          + Drupal.t('Try @hex', { '@hex': fix })
          + `<span class="jarvis-contrast-fix-swatch" style="background:${fix}"></span></button>`;

        const update = () => {
          if (!HEX.test(fg.value) || !HEX.test(bg.value)) {
            badge.innerHTML = '';
            badge.hidden = true;
            return;
          }
          badge.hidden = false;
          const r = ratio(fg.value, bg.value);
          let html = `<span class="jarvis-contrast-ratio">${r.toFixed(2)}:1</span>`;
          if (isDistinguish) {
            html += chip(Drupal.t('Distinct from text'), LARGE, r);
            if (r < LARGE) {
              const legibleOnRef = ref && HEX.test(ref.value)
                ? (c) => ratio(c, ref.value) >= SMALL
                : null;
              const fix = suggest(fg.value, bg.value, LARGE, legibleOnRef);
              html += fix ? fixButton(fix) : '';
              html += `<span class="jarvis-contrast-note">${Drupal.t('or underline links')}</span>`;
            }
          }
          else {
            html += chip(Drupal.t('Small text'), SMALL, r)
              + chip(Drupal.t('Large text'), LARGE, r);
            if (r < SMALL) {
              const fix = suggest(fg.value, bg.value, SMALL);
              html += fix ? fixButton(fix) : '';
            }
          }
          badge.innerHTML = html;
        };

        badge.addEventListener('click', (e) => {
          const btn = e.target.closest('.jarvis-contrast-fix');
          if (!btn) return;
          fg.value = btn.dataset.fix;
          // Re-sync the picker swatch and any other pair using this field.
          fg.dispatchEvent(new Event('input', { bubbles: true }));
        });

        fg.addEventListener('input', update);
        bg.addEventListener('input', update);
        if (ref) ref.addEventListener('input', update);
        update();
      });
    },
  };
})(Drupal, drupalSettings, once);
