/**
 * Light motion layer:
 *  - Scroll reveals: elements fade up as they enter the viewport, staggered within a group.
 *  - Count-ups: stat numbers ("500+", "70+", "39") count up once when first seen.
 * Does nothing when the visitor prefers reduced motion. Content is never hidden
 * unless this script runs, so the page still works without JavaScript.
 */
const REVEAL_GROUPS = [
  '.section-head, .segments > .container > .h2, .next > .container > .h2, .live__head, .ctrl__hero',
  '.ep-list > .ep',
  // The rail as one block: individual clips sit off-screen sideways and would never trigger.
  '.clip-rail',
  '.tiktok',
  '.seg-list > .seg',
  '.host__grid > *',
  '.next__grid > *, .sponsor-strip',
  '.faq__item',
  '.news',
  '.video, .info-grid',
  '.features > .feature',
  '.team__grid > .team-card, .flow, .why',
  '.reach, .logos, .tiers > .tier',
];
const STAGGER_MS = 70;
const MAX_STAGGER = 6;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMotion() {
  if (reducedMotion() || !('IntersectionObserver' in window)) return;
  initReveals();
  initCountUps();
}

function initReveals() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  REVEAL_GROUPS.forEach((selector) => {
    // Stagger siblings that share a parent, so a list ripples in rather than popping at once.
    const counters = new Map();
    document.querySelectorAll(selector).forEach((el) => {
      // Only animate what starts below the fold: no flicker on content already on screen.
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      const i = counters.get(el.parentElement) ?? 0;
      counters.set(el.parentElement, i + 1);
      el.style.setProperty('--reveal-delay', `${Math.min(i, MAX_STAGGER) * STAGGER_MS}ms`);
      el.classList.add('reveal');
      observer.observe(el);
    });
  });
}

function initCountUps() {
  const targets = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        countUp(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  targets.forEach((el) => observer.observe(el));
}

function countUp(el) {
  const match = el.textContent.trim().match(/^(\d+)(.*)$/);
  if (!match) return;
  const end = Number(match[1]);
  const suffix = match[2];
  const duration = 1200;
  let start = null;

  // Start the clock on the first frame: rAF timestamps can be earlier than
  // performance.now() at call time, which would give a negative first value.
  const tick = (now) => {
    start ??= now;
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = `${Math.round(end * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
