/**
 * @file
 * Count-up animation for stat cards. Animates [data-count-up] from 0 to its
 * number when scrolled into view. Preserves prefix/suffix (e.g. "1,200+").
 */
((Drupal, once) => {
  // ponytail: parse "$1,200+" -> {prefix:"$", value:1200, suffix:"+", commas:true}
  const parse = (raw) => {
    const m = raw.match(/^(\D*)([\d,]*\.?\d+)(\D*)$/);
    if (!m) return null;
    return {
      prefix: m[1],
      value: parseFloat(m[2].replace(/,/g, '')),
      suffix: m[3],
      commas: m[2].includes(','),
      decimals: (m[2].split('.')[1] || '').length,
    };
  };

  const render = (p, n) => {
    let s = n.toFixed(p.decimals);
    if (p.commas) s = Number(s).toLocaleString(undefined, { minimumFractionDigits: p.decimals });
    return p.prefix + s + p.suffix;
  };

  const run = (el) => {
    const p = parse(el.textContent.trim());
    if (!p) return;
    const dur = 1600;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = render(p, p.value * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  Drupal.behaviors.jarvisStatCountUp = {
    attach(context) {
      once('jarvis-count-up', '[data-count-up]', context).forEach((el) => {
        // ADA (WCAG 2.3.3): reduced-motion users get the final value, no animation.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (!('IntersectionObserver' in window)) return run(el); // ponytail: old browsers just see final value
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              run(el);
              io.disconnect();
            }
          });
        }, { threshold: 0.4 });
        io.observe(el);
      });
    },
  };
})(Drupal, once);
