/**
 * @file
 * Pause/play control for the Video Background component.
 *
 * WCAG 2.2.2: background footage loops for longer than five seconds, so it
 * needs a user-operable pause. The same control doubles as the honouring of
 * prefers-reduced-motion — when that is set the video starts paused on its
 * poster and the button offers "play" instead.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.jarvisVideoBackground = {
    attach: function (context) {
      once('jarvis-video-bg', '[data-jarvis-video-bg-toggle]', context).forEach(function (button) {
        var band = button.closest('.jarvis-video-bg');
        var video = band ? band.querySelector('.jarvis-video-bg__media') : null;
        if (!video) {
          button.remove();
          return;
        }
        var label = button.querySelector('.jarvis-video-bg__toggle-label');

        function sync(paused) {
          button.setAttribute('aria-pressed', paused ? 'true' : 'false');
          if (label) {
            label.textContent = paused
              ? Drupal.t('Play background video')
              : Drupal.t('Pause background video');
          }
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          video.removeAttribute('autoplay');
          video.pause();
        }
        sync(video.paused);

        button.addEventListener('click', function () {
          if (video.paused) {
            video.play();
          }
          else {
            video.pause();
          }
        });
        // Driven off the media events, not the click, so autoplay being blocked
        // by the browser still leaves the button showing the true state.
        video.addEventListener('play', function () {
          sync(false);
        });
        video.addEventListener('pause', function () {
          sync(true);
        });
      });
    }
  };
})(Drupal, once);
