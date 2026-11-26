/**
 * Episode list: format/segment filter plus "show all".
 * Episodes beyond the first few carry [data-extra] and stay collapsed until
 * "Show all" is pressed. Picking a filter always shows every match.
 */
export function initEpisodeFilters() {
  const list = document.querySelector('[data-ep-list]');
  if (!list) return;

  const buttons = document.querySelectorAll('[data-filter]');
  const episodes = list.querySelectorAll('.ep');
  const more = document.querySelector('[data-ep-more]');
  const empty = document.querySelector('[data-ep-empty]');
  let filter = 'all';
  let expanded = false;

  const apply = () => {
    let visible = 0;
    episodes.forEach((ep) => {
      const matches = filter === 'all' || ep.dataset.tags.split(' ').includes(filter);
      const collapsed = filter === 'all' && !expanded && ep.hasAttribute('data-extra');
      ep.hidden = !matches || collapsed;
      if (!ep.hidden) visible++;
    });
    if (empty) empty.hidden = visible > 0;
    if (more) more.hidden = filter !== 'all' || expanded || !list.querySelector('[data-extra]');
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      apply();
    });
  });

  more?.addEventListener('click', () => {
    expanded = true;
    more.setAttribute('aria-expanded', 'true');
    apply();
  });

  apply();
}
