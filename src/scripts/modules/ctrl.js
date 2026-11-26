/**
 * CTRL + BUILD page:
 *  - Keycaps (or a real Ctrl + B) "build" the show: keys press, a build log prints,
 *    and the whiteboard redraws.
 *  - The whiteboard draws itself in marker, and the terminal types out the episode
 *    flow, once each scrolls into view.
 * With reduced motion (or no JS) everything is simply shown complete.
 */
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initCtrl() {
  const board = document.querySelector('[data-board]');
  const term = document.querySelector('[data-term]');
  if (!board && !term && !document.querySelector('[data-build-key]')) return;

  if (!reduced() && 'IntersectionObserver' in window) {
    playWhenVisible(board, 'is-drawn');
    playWhenVisible(term, 'is-running');
  }
  initBuildKeys(board);
}

function playWhenVisible(el, className) {
  if (!el) return;
  el.classList.add('is-armed');
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      el.classList.add(className);
    },
    { threshold: 0.35 },
  );
  observer.observe(el);
}

function replay(el, className) {
  if (!el || reduced()) return;
  el.classList.add('is-armed');
  el.classList.remove(className);
  void el.offsetWidth; // restart the transitions
  el.classList.add(className);
}

const PHRASES = [
  '3 engineers · 7 steps · 0 shortcuts',
  'senior thinking compiled for juniors',
  'trade-offs resolved (mostly)',
  'whiteboard redrawn from scratch',
];

function initBuildKeys(board) {
  const keys = document.querySelectorAll('[data-build-key]');
  const log = document.querySelector('[data-build-log]');
  if (!keys.length || !log) return;
  let builds = 0;
  let busy = false;

  const build = () => {
    if (busy) return;
    busy = true;
    builds += 1;
    keys.forEach((k) => k.classList.add('is-down'));
    log.textContent = `> building #${builds}…`;

    setTimeout(() => keys.forEach((k) => k.classList.remove('is-down')), 180);
    setTimeout(() => {
      log.innerHTML = `> build #${builds} <b>succeeded</b><br />${PHRASES[(builds - 1) % PHRASES.length]}`;
      replay(board, 'is-drawn');
      busy = false;
    }, reduced() ? 0 : 650);
  };

  keys.forEach((k) => k.addEventListener('click', build));
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      build();
    }
  });
}
