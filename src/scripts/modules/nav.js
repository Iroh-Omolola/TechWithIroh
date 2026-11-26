/** Mobile navigation drawer. */
export function initNav() {
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const links = document.querySelector('[data-nav-links]');
  if (!nav || !toggle || !links) return;

  // Mark the link for the current page (nav is a shared partial across pages).
  const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  links.querySelectorAll('a:not(.btn)').forEach((a) => {
    const url = new URL(a.href);
    if (!url.hash && url.pathname.replace(/\.html$/, '') === path) a.setAttribute('aria-current', 'page');
  });

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  // Reset if the viewport grows past the mobile breakpoint while open.
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}
