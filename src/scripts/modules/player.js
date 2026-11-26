/**
 * Persistent mini-player.
 * Every element with [data-play="<episode id>"] starts that episode. Audio episodes
 * play through a native <audio> element; video episodes play in a small YouTube
 * embed docked at the bottom of the screen. Either way it keeps playing while the
 * visitor scrolls.
 */
const fmt = (sec) => {
  if (!Number.isFinite(sec)) return '0:00';
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  const m = Math.floor(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

export function initPlayer() {
  const mini = document.querySelector('[data-mini]');
  const dataEl = document.getElementById('episode-data');
  if (!mini || !dataEl) return;

  const episodes = JSON.parse(dataEl.textContent);
  const audio = mini.querySelector('[data-mini-audio]');
  const media = mini.querySelector('[data-mini-media]');
  const title = mini.querySelector('[data-mini-title]');
  const kind = mini.querySelector('[data-mini-kind]');
  const toggle = mini.querySelector('[data-mini-toggle]');
  const seek = mini.querySelector('[data-mini-seek]');
  const current = mini.querySelector('[data-mini-current]');
  const duration = mini.querySelector('[data-mini-duration]');
  const link = mini.querySelector('[data-mini-link]');
  const audioUi = mini.querySelectorAll('[data-mini-audio-ui]');

  let currentId = null;
  let seeking = false;

  /** Reflect play state on every trigger for the current episode. */
  const sync = () => {
    const playing = currentId && episodes[currentId]?.source === 'audio' ? !audio.paused : !!currentId;
    document.querySelectorAll('[data-play]').forEach((btn) => {
      btn.classList.toggle('is-playing', btn.dataset.play === currentId && playing);
    });
    toggle.classList.toggle('is-playing', !audio.paused);
    mini.classList.toggle('is-active', playing);
    toggle.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
  };

  const stopVideo = () => media.querySelector('iframe')?.remove();

  const close = () => {
    audio.pause();
    audio.removeAttribute('src');
    stopVideo();
    media.replaceChildren();
    mini.hidden = true;
    document.body.classList.remove('has-mini');
    currentId = null;
    sync();
  };

  const open = (id) => {
    const ep = episodes[id];
    if (!ep) return;

    // Same episode again → toggle pause/play (audio) instead of restarting.
    if (id === currentId && ep.source === 'audio') {
      audio.paused ? audio.play() : audio.pause();
      return;
    }

    document.dispatchEvent(new CustomEvent('twi:media-start', { detail: 'player' }));
    audio.pause();
    stopVideo();
    currentId = id;
    title.textContent = ep.title;
    link.href = ep.url;
    mini.hidden = false;
    document.body.classList.add('has-mini');
    mini.classList.toggle('mini--video', ep.source === 'youtube');
    audioUi.forEach((el) => (el.hidden = ep.source !== 'audio'));

    if (ep.source === 'youtube') {
      kind.textContent = 'Watching';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${ep.youtubeId}?autoplay=1&playsinline=1&rel=0`;
      iframe.title = ep.title;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      media.replaceChildren(iframe);
      link.setAttribute('aria-label', 'Open on YouTube');
    } else {
      kind.textContent = 'Listening';
      const img = document.createElement('img');
      img.src = ep.thumb;
      img.alt = '';
      media.replaceChildren(img);
      link.setAttribute('aria-label', 'Open on Spotify');
      audio.src = ep.audioUrl;
      audio.play().catch(() => {});

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: ep.title,
          artist: 'Tech with Iroh',
          artwork: [{ src: ep.thumb, sizes: '600x600' }],
        });
      }
    }
    sync();
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-play]');
    if (trigger) open(trigger.dataset.play);
  });

  // Clips playing inline pause the mini-player, and vice versa.
  document.addEventListener('twi:media-start', (e) => {
    if (e.detail !== 'player' && currentId) {
      if (episodes[currentId].source === 'audio') audio.pause();
      else close();
    }
  });

  toggle.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
  mini.querySelectorAll('[data-mini-skip]').forEach((btn) =>
    btn.addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime + Number(btn.dataset.miniSkip));
    }),
  );
  mini.querySelector('[data-mini-close]').addEventListener('click', close);

  seek.addEventListener('input', () => {
    seeking = true;
    current.textContent = fmt(Number(seek.value));
  });
  seek.addEventListener('change', () => {
    audio.currentTime = Number(seek.value);
    seeking = false;
  });

  audio.addEventListener('loadedmetadata', () => {
    seek.max = Math.floor(audio.duration);
    duration.textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    if (seeking) return;
    seek.value = Math.floor(audio.currentTime);
    current.textContent = fmt(audio.currentTime);
    seek.style.setProperty('--progress', `${(audio.currentTime / audio.duration) * 100 || 0}%`);
  });
  ['play', 'pause', 'ended'].forEach((ev) => audio.addEventListener(ev, sync));

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('seekbackward', () => (audio.currentTime -= 15));
    navigator.mediaSession.setActionHandler('seekforward', () => (audio.currentTime += 30));
  }
}
