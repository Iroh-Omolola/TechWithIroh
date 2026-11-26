/**
 * Short-form clips.
 * - Clip cards swap their thumbnail for the real player only when tapped, so the
 *   page never loads a dozen video embeds up front (important on mobile data).
 * - TikTok's creator embed script is loaded only when its block scrolls near view.
 */
const EMBEDS = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&loop=1&playlist=${id}`,
  tiktok: (id) => `https://www.tiktok.com/player/v1/${id}?autoplay=1&rel=0`,
};

export function initClips() {
  document.querySelectorAll('[data-clip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [platform, id] = btn.dataset.clip.split(':');
      const src = EMBEDS[platform]?.(id);
      if (!src) return;

      document.dispatchEvent(new CustomEvent('twi:media-start', { detail: 'clip' }));
      // Only one clip plays at a time: restore any other open clip.
      document.querySelectorAll('.clip.is-playing').forEach((el) => {
        el.querySelector('iframe')?.remove();
        el.classList.remove('is-playing');
      });

      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = btn.getAttribute('aria-label');
      iframe.allow = 'autoplay; encrypted-media; fullscreen';
      iframe.allowFullscreen = true;
      btn.parentElement.classList.add('is-playing');
      btn.parentElement.append(iframe);
      iframe.focus();
    });
  });

  initTikTokEmbed();
}

function initTikTokEmbed() {
  const target = document.querySelector('[data-tiktok-embed]');
  if (!target || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.append(script);
    },
    { rootMargin: '300px' },
  );
  observer.observe(target);
}
