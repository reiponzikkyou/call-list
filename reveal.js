(() => {
  const selectors = [
    '.home-page .intro-card',
    '.home-page .widget-card',
    '.home-page .song-item',
    '.home-page .tool-card',
    '.mix-page .mix-intro',
    '.mix-page .mix-card',
    'body:not(.home-page):not(.mix-page):not(.timeline-page) .notice',
    'body:not(.home-page):not(.mix-page):not(.timeline-page) .call-block'
  ].join(',');

  let revealSequence = 0;
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          .forEach((entry, index) => {
            window.setTimeout(() => entry.target.classList.add('is-revealed'), index * 75);
            observer.unobserve(entry.target);
          });
      }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' })
    : null;

  function registerRevealItems(root = document) {
    const items = [];
    if (root.nodeType === Node.ELEMENT_NODE && root.matches(selectors)) items.push(root);
    if (root.querySelectorAll) items.push(...root.querySelectorAll(selectors));

    items.forEach((item) => {
      if (item.classList.contains('reveal-item')) return;
      item.classList.add('reveal-item');
      item.style.setProperty('--reveal-sequence', revealSequence++);
      if (observer) observer.observe(item);
      else item.classList.add('is-revealed');
    });
  }

  const start = () => {
    registerRevealItems();
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => registerRevealItems(node));
      });
    }).observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
