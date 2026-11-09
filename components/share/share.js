/**
 * @file
 * "Copy link" for the share component. The button ships hidden so it never
 * shows where the Clipboard API (or JS) is missing; the status region tells
 * screen-reader users the copy worked.
 */
((Drupal, once) => {
  Drupal.behaviors.jarvisShare = {
    attach(context) {
      if (!navigator.clipboard) return;
      once('jarvis-share', '[data-jarvis-share-copy]', context).forEach((btn) => {
        btn.hidden = false;
        const status = btn.parentElement.querySelector('.jarvis-share__status');
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(btn.dataset.jarvisShareCopy);
            btn.classList.add('is-copied');
            if (status) status.textContent = Drupal.t('Link copied');
            setTimeout(() => {
              btn.classList.remove('is-copied');
              if (status) status.textContent = '';
            }, 2000);
          } catch (e) {
            if (status) status.textContent = Drupal.t('Could not copy the link');
          }
        });
      });
    },
  };
})(Drupal, once);
