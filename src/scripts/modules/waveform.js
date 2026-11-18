const BAR_COUNT = 40;
const PLAYED_BARS = 14;

/** Renders the decorative waveform in the hero player. */
export function initWaveform() {
  const wave = document.querySelector('[data-waveform]');
  if (!wave) return;

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('i');
    bar.style.height = `${6 + Math.abs(Math.sin(i * 1.7)) * 14}px`;
    if (i < PLAYED_BARS) bar.className = 'is-on';
    fragment.appendChild(bar);
  }
  wave.replaceChildren(fragment);
}
