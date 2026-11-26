import '../styles/main.css';

import { initNav } from './modules/nav.js';
import { initPlayer } from './modules/player.js';
import { initClips } from './modules/clips.js';
import { initEpisodeFilters } from './modules/episodeFilters.js';
import { initFaq } from './modules/faq.js';
import { initNewsletter } from './modules/newsletter.js';
import { initMotion } from './modules/motion.js';
import { initLive } from './modules/live.js';

initNav();
initPlayer();
initClips();
initEpisodeFilters();
initFaq();
initNewsletter();
initMotion();
initLive();

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
