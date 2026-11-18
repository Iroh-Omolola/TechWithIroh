/** Category filter for the episode list. */
export function initEpisodeFilters() {
  const buttons = document.querySelectorAll('[data-filter]');
  const episodes = document.querySelectorAll('[data-category]');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      episodes.forEach((ep) => {
        ep.hidden = filter !== 'all' && ep.dataset.category !== filter;
      });
    });
  });
}
