/**
 * Auto-expand the Canvas right settings tray when a wide-content field (CKEditor
 * rich text or a plain textarea) inside it is focused; collapse when focus leaves.
 *
 * JS (not CSS :has()) because :has() is unsupported in older browsers.
 *
 * Sets a data-jarvis-wide attribute — NOT a class — on the tray's right column.
 * React owns that element's className and would strip an added class on re-render;
 * it does not manage data-* attributes we add, so those survive. css/canvas-tray.css
 * widens [data-jarvis-wide] with !important, beating Canvas's inline React width.
 */
((Drupal, once) => {
  const PANEL = '[data-testid="canvas-contextual-panel"]';

  // The width-bearing element is the ancestor of the panel that carries an inline
  // pixel width (Canvas sets it via React inline style). Fall back to the panel's
  // parent if none is found.
  const widthEl = (panel) => {
    let el = panel.parentElement;
    while (el && el !== document.body) {
      if (/\d+px/.test(el.style.width || '')) return el;
      el = el.parentElement;
    }
    return panel.parentElement;
  };

  const qualifies = (el) =>
    !!el &&
    (el.matches('textarea') || el.isContentEditable || !!el.closest('.ck-editor'));

  const update = () => {
    const panel = document.querySelector(PANEL);
    if (!panel || !panel.parentElement) return;
    const el = widthEl(panel);
    const ae = document.activeElement;
    if (ae && panel.contains(ae) && qualifies(ae)) {
      el.setAttribute('data-jarvis-wide', '');
    } else {
      el.removeAttribute('data-jarvis-wide');
    }
  };

  Drupal.behaviors.jarvisTrayAutoExpand = {
    attach() {
      once('jarvis-tray-autoexpand', 'body').forEach(() => {
        const schedule = () => requestAnimationFrame(update);
        document.addEventListener('focusin', schedule);
        document.addEventListener('focusout', schedule);
      });
    },
  };
})(Drupal, once);
