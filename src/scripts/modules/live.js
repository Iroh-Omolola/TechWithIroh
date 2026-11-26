/**
 * Live show page: countdown, jury-duty vote and the tilting paper ticket.
 */
export function initLive() {
  initCountdown();
  initJury();
  initTicketTilt();
}

function initCountdown() {
  const el = document.querySelector('[data-countdown]');
  if (!el) return;
  const target = new Date(el.dataset.countdown).getTime();
  const parts = Object.fromEntries([...el.querySelectorAll('[data-cd]')].map((b) => [b.dataset.cd, b]));
  const pad = (n) => String(n).padStart(2, '0');

  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) {
      el.innerHTML = ms > -864e5 ? '<p class="countdown__done">It’s today. See you there!</p>' : '';
      return false;
    }
    const s = Math.floor(ms / 1000);
    parts.days.textContent = Math.floor(s / 86400);
    parts.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    parts.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    parts.seconds.textContent = pad(s % 60);
    return true;
  };
  if (tick()) {
    const timer = setInterval(() => tick() || clearInterval(timer), 1000);
  }
}

/** Practice vote. Stored only in this browser: there are no shared results to show. */
const JURY_KEY = 'twi-jury-qa-vs-dev';

function initJury() {
  const root = document.querySelector('[data-jury]');
  if (!root) return;
  const kase = root.querySelector('.case');
  const buttons = root.querySelectorAll('[data-verdict]');
  const result = root.querySelector('[data-jury-result]');
  const choice = root.querySelector('[data-jury-choice]');

  const show = (verdict) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.verdict === verdict)));
    kase.classList.toggle('has-verdict', !!verdict);
    result.hidden = !verdict;
    if (verdict) choice.textContent = verdict;
  };
  const save = (verdict) => {
    try {
      verdict ? localStorage.setItem(JURY_KEY, verdict) : localStorage.removeItem(JURY_KEY);
    } catch {}
  };

  buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      show(btn.dataset.verdict);
      save(btn.dataset.verdict);
    }),
  );
  root.querySelector('[data-jury-reset]').addEventListener('click', () => {
    show(null);
    save(null);
    buttons[0].focus();
  });

  let saved = null;
  try {
    saved = localStorage.getItem(JURY_KEY);
  } catch {}
  if (saved) show(saved);
}

/** The ticket tilts in 3D toward the mouse, then settles back. */
function initTicketTilt() {
  const area = document.querySelector('.poster');
  const ticket = document.querySelector('[data-ticket]');
  if (!area || !ticket || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = null;
  area.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const r = ticket.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5)));
      const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 2.5)));
      ticket.style.setProperty('--tilt-y', `${(x * 12).toFixed(2)}deg`);
      ticket.style.setProperty('--tilt-x', `${(-y * 10).toFixed(2)}deg`);
      ticket.classList.add('is-tracking');
    });
  });
  area.addEventListener('pointerleave', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    ticket.classList.remove('is-tracking');
    ticket.style.setProperty('--tilt-x', '0deg');
    ticket.style.setProperty('--tilt-y', '0deg');
  });
}
