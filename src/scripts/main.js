import '../styles/main.css';

import { initNav } from './modules/nav.js';
import { initWaveform } from './modules/waveform.js';
import { initEpisodeFilters } from './modules/episodeFilters.js';
import { initFaq } from './modules/faq.js';
import { initNewsletter } from './modules/newsletter.js';

initNav();
initWaveform();
initEpisodeFilters();
initFaq();
initNewsletter();

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
