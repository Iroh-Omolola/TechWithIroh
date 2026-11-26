/**
 * Vite plugin: renders shared partials and real show content into the HTML pages
 * at build time (and on every request in dev), so episode lists are plain HTML
 * that search engines and slow connections get without waiting for JavaScript.
 *
 * Markers:
 *   <!-- @include name -->   → src/partials/name.html
 *   <!-- @wall -->           → hero wall of pinned episode prints
 *   <!-- @episodes -->       → full episode list
 *   <!-- @clips -->          → short-form clip rail
 *   <!-- @player-data -->    → JSON the mini-player reads
 *   {{episodeCount}}         → total number of episodes
 *   {{latestId}}             → id of the newest episode (for play buttons)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const CONTENT = fileURLToPath(new URL('src/data/content.json', root));
const PARTIALS = fileURLToPath(new URL('src/partials/', root));
const EPISODES_SHOWN = 8;

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const fmtDuration = (sec) => {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} hr ${m} min` : `${m} min`;
};

const tagsFor = (ep) => {
  const tags = [ep.source === 'youtube' ? 'video' : 'audio'];
  if (/courtroom/i.test(ep.title)) tags.push('courtroom');
  return tags.join(' ');
};

function renderEpisode(ep, index) {
  const isVideo = ep.source === 'youtube';
  const num = ep.number ? `EP ${String(ep.number).padStart(2, '0')}` : 'VIDEO';
  const meta = [fmtDuration(ep.duration), fmtDate(ep.date)].filter(Boolean).join(' · ');
  return `
          <li class="ep" data-tags="${tagsFor(ep)}"${index >= EPISODES_SHOWN ? ' data-extra' : ''}>
            <span class="ep__num"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="ep__label">${num}</span></span>
            <div class="ep__body"><div><h3>${esc(ep.title)}</h3>${ep.summary ? `<p>${esc(ep.summary)}</p>` : ''}</div></div>
            <div class="ep__meta"><span class="tag${isVideo ? ' tag--video' : ''}">${isVideo ? 'Watch' : 'Listen'}</span><span class="ep__time">${meta}</span></div>
            <button class="circle-btn" type="button" data-play="${ep.id}" aria-label="Play: ${esc(ep.title)}"><span class="play-icon"></span></button>
          </li>`;
}

/**
 * Hero "wall": real episode thumbnails pinned up like prints. The newest episode
 * is the big one; the two most recent other video episodes sit behind it.
 */
function renderWall(episodes) {
  const [latest] = episodes;
  if (!latest) return '';
  const others = episodes.filter((e) => e !== latest && e.source === 'youtube').slice(0, 2);
  const print = (ep, variant, big) => `
            <button class="print print--${variant}" type="button" data-play="${ep.id}" aria-label="Play${big ? ' latest episode' : ''}: ${esc(ep.title)}">
              <span class="print__tape" aria-hidden="true"></span>
              <img src="${big ? ep.thumbLarge || ep.thumb : ep.thumb}" alt="" width="${big ? 1280 : 480}" height="${big ? 720 : 360}"${big ? ' fetchpriority="high"' : ' loading="lazy"'} />
              ${big ? '<span class="print__play" aria-hidden="true"><span class="play-icon"></span></span>' : ''}
              <span class="print__caption">${esc(ep.title)}</span>
            </button>`;
  return [print(latest, 'main', true), ...others.map((ep, i) => print(ep, i ? 'low' : 'high', false))].join('');
}

function renderClip(clip) {
  const thumb =
    clip.thumb || (clip.platform === 'youtube' ? `https://i.ytimg.com/vi/${clip.id}/hqdefault.jpg` : '');
  const platform = clip.platform === 'tiktok' ? 'TikTok' : 'Shorts';
  return `
          <li class="clip clip--${clip.platform}">
            <button class="clip__btn" type="button" data-clip="${clip.platform}:${esc(clip.id)}" aria-label="Play clip${clip.title ? `: ${esc(clip.title)}` : ''}">
              ${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy" width="480" height="360" />` : ''}
              <span class="clip__platform">${platform}</span>
              <span class="clip__play"><span class="play-icon"></span></span>
              ${clip.title ? `<span class="clip__title">${esc(clip.title)}</span>` : ''}
            </button>
          </li>`;
}

function renderPlayerData(episodes) {
  const data = Object.fromEntries(
    episodes.map((ep) => [
      ep.id,
      {
        title: ep.title,
        source: ep.source,
        youtubeId: ep.youtubeId,
        audioUrl: ep.audioUrl,
        thumb: ep.thumb,
        url: ep.url,
      },
    ]),
  );
  // Escape "<" so episode text can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/json" id="episode-data">${json}</script>`;
}

export function render(html) {
  const content = JSON.parse(readFileSync(CONTENT, 'utf8'));
  const { episodes, clips } = content;

  // Partials first (they may contain other markers). One level of nesting is enough.
  for (let pass = 0; pass < 2; pass++) {
    html = html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
      readFileSync(`${PARTIALS}${name}.html`, 'utf8'),
    );
  }

  const extra = Math.max(0, episodes.length - EPISODES_SHOWN);
  return html
    .replace('<!-- @wall -->', () => renderWall(episodes))
    .replace('<!-- @episodes -->', () => episodes.map(renderEpisode).join(''))
    .replace('<!-- @clips -->', () => clips.map(renderClip).join(''))
    .replace('<!-- @player-data -->', () => renderPlayerData(episodes))
    .replaceAll('{{episodeCount}}', String(episodes.length))
    .replaceAll('{{extraCount}}', String(extra))
    .replaceAll('{{latestId}}', episodes[0]?.id ?? '');
}

export function contentPlugin() {
  return {
    name: 'twi-content',
    transformIndexHtml: { order: 'pre', handler: render },
    configureServer(server) {
      server.watcher.add([CONTENT, PARTIALS]);
      server.watcher.on('change', (file) => {
        if (file === CONTENT || file.startsWith(PARTIALS)) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
