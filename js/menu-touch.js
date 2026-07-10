/**
 * @file
 * Touch support for the pure-CSS hover dropdowns: on coarse-pointer devices
 * at desktop width (e.g. iPad landscape, >=992px), the CSS :hover reveal
 * never fires, so a parent link would just navigate. Here the first tap on a
 * parent link opens its submenu (.jarvis-open, styled in overrides.css) and
 * the second tap follows the link. Mouse users and mobile (<992px, submenus
 * rendered always-open) are untouched.
 */
(function () {
  'use strict';

  var OPEN = 'jarvis-open';

  function closeAll(scope) {
    var open = scope.querySelectorAll('.jarvis-primary-menu li.' + OPEN);
    for (var i = 0; i < open.length; i++) {
      open[i].classList.remove(OPEN);
      var a = open[i].querySelector(':scope > a');
      if (a) a.setAttribute('aria-expanded', 'false');
    }
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
    a.setAttribute('aria-expanded', 'true');
  });
})();
