/**
 * @file
 * Menu interaction + ARIA for the pure-CSS hover dropdowns.
 *
 * - Touch (coarse pointer at desktop width, e.g. iPad landscape): the CSS
 *   :hover reveal never fires, so the first tap on a parent link opens its
 *   submenu (.jarvis-open, styled in overrides.css) and the second tap
 *   follows the link.
 * - ARIA (WCAG 4.1.2): submenu parents carry aria-haspopup/aria-expanded,
 *   kept in sync with hover, focus and tap opens. <nolink> parents render as
 *   <span> — not natively focusable — so they get tabindex="0",
 *   role="button" and an Enter/Space toggle.
 * - Escape (WCAG 1.4.13): dismisses any open submenu and returns focus to
 *   its parent trigger.
 *
 * Desktop (>=992px) only: below that, submenus render always-open inside the
 * offcanvas drawer, where expand/collapse semantics would be a lie.
 */
(function () {
  'use strict';

  var OPEN = 'jarvis-open';
  var mq = window.matchMedia('(min-width: 992px)');

  function trigger(li) {
    return li.querySelector(':scope > a, :scope > span');
  }

  function parentItems() {
    var out = [];
    var lis = document.querySelectorAll('.jarvis-primary-menu nav li');
    for (var i = 0; i < lis.length; i++) {
      if (lis[i].querySelector(':scope > ul')) out.push(lis[i]);
    }
    return out;
  }

  function setExpanded(li, on) {
    var t = trigger(li);
    if (t && t.hasAttribute('aria-expanded')) {
      t.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
  }

  function closeAll(scope) {
    var open = scope.querySelectorAll('.jarvis-primary-menu li.' + OPEN);
    for (var i = 0; i < open.length; i++) {
      open[i].classList.remove(OPEN);
      setExpanded(open[i], false);
    }
  }

  // aria-expanded mirrors every way a submenu can open: tap (.jarvis-open),
  // hover (:hover) and keyboard focus (:focus-within via activeElement).
  function sync() {
    if (!mq.matches) return;
    parentItems().forEach(function (li) {
      var open = li.classList.contains(OPEN)
        || li.matches(':hover')
        || li.contains(document.activeElement);
      setExpanded(li, open);
    });
  }

  // Add/remove the ARIA contract when crossing the desktop breakpoint.
  function apply() {
    parentItems().forEach(function (li) {
      var t = trigger(li);
      if (!t) return;
      if (mq.matches) {
        t.setAttribute('aria-haspopup', 'true');
        t.setAttribute('aria-expanded', li.classList.contains(OPEN) ? 'true' : 'false');
        if (t.tagName === 'SPAN') {
          t.setAttribute('tabindex', '0');
          t.setAttribute('role', 'button');
        }
      }
      else {
        t.removeAttribute('aria-haspopup');
        t.removeAttribute('aria-expanded');
        if (t.tagName === 'SPAN') {
          t.removeAttribute('tabindex');
          t.removeAttribute('role');
        }
      }
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('.jarvis-primary-menu li > a');
    if (!a) {
      closeAll(document);  // tap outside the menu closes any open submenu
      return;
    }
    // Only intercept when hover can't reveal the submenu.
    if (!window.matchMedia('(min-width: 992px) and (hover: none)').matches) return;
    var li = a.parentElement;
    if (!li.querySelector(':scope > ul')) return;   // leaf link: navigate
    if (li.classList.contains(OPEN)) return;        // second tap: navigate
    e.preventDefault();
    closeAll(li.parentElement);                     // close siblings, keep ancestors
    li.classList.add(OPEN);
    setExpanded(li, true);
  });

  document.addEventListener('keydown', function (e) {
    // Enter/Space on a <nolink> span parent toggles its submenu.
    if (e.key === 'Enter' || e.key === ' ') {
      var span = e.target.closest
        && e.target.closest('.jarvis-primary-menu nav span[role="button"]');
      if (!span) return;
      e.preventDefault();
      var li = span.parentElement;
      var was = li.classList.contains(OPEN);
      closeAll(li.parentElement);
      if (!was) li.classList.add(OPEN);
      sync();
      return;
    }
    // Escape dismisses an open submenu (WCAG 1.4.13) and restores focus.
    if (e.key === 'Escape') {
      var sub = document.activeElement
        && document.activeElement.closest
        && document.activeElement.closest('.jarvis-primary-menu li > ul');
      closeAll(document);
      if (sub) {
        var t = trigger(sub.parentElement);
        if (t) t.focus();  // leaving the ul ends :focus-within -> CSS closes
      }
      setTimeout(sync, 0);
    }
  });

  // Keep aria-expanded honest for hover/focus opens (CSS-driven).
  var nav = document.querySelector('.jarvis-primary-menu');
  if (nav) {
    ['mouseover', 'mouseout'].forEach(function (ev) {
      nav.addEventListener(ev, sync);
    });
    ['focusin', 'focusout'].forEach(function (ev) {
      // Focus settles after the event; read activeElement on the next tick.
      nav.addEventListener(ev, function () { setTimeout(sync, 0); });
    });
  }

  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
})();
