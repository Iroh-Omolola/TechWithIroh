/**
 * Pulls the show's real content into src/data/content.json:
 *   - Long-form YouTube episodes + Shorts (YouTube channel feed, latest 15 uploads)
 *   - Audio episodes (Spotify for Creators / Anchor RSS, full back catalogue)
 *
 * Runs automatically before `dev` and `build`. If the network is unavailable the
 * previously committed content.json is kept, so builds never break offline.
 */
import { readFile, writeFile } from 'node:fs/promises';

const YOUTUBE_CHANNEL_ID = 'UCXtNC3ODjHfTgtOhbv2vosw';
const RSS_URL = 'https://anchor.fm/s/d8a6029c/podcast/rss';
const OUT = new URL('../src/data/content.json', import.meta.url);
const TIKTOK = new URL('../src/data/tiktok.json', import.meta.url);

const decode = (s = '') =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
};
const attr = (xml, name, attribute) => {
  const m = xml.match(new RegExp(`<${name}[^>]*\\s${attribute}="([^"]+)"`));
  return m ? decode(m[1]) : '';
};

/** First meaningful sentence of a description, without HTML, links or hashtags. */
const summarise = (text, title = '') => {
  let plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(intro|outro)\s+music\b[\s\S]*$/i, '') // drop music credits
    .replace(/^[^\p{L}\p{N}]+/u, '') // leading emoji
    .trim();
  // Descriptions often repeat the title (or its first part) before the real text.
  const lead = title.split(/[|:—-]/)[0].trim();
  if (lead && plain.toLowerCase().startsWith(lead.toLowerCase())) {
    plain = plain.slice(lead.length).replace(/^[\s|:—-]+/, '');
    const dup = plain.match(/^[^.!?]{0,60}?(?=\s(In this|This|We|I)\b)/);
    if (dup && dup[0].length < 60) plain = plain.slice(dup[0].length).trim();
  }
  const sentence = plain.match(/^.{20,180}?[.!?](\s|$)/);
  return (sentence ? sentence[0] : plain.slice(0, 160)).trim();
};

/** "00:25:41" or "1541" → seconds */
const toSeconds = (d) => {
  if (!d) return 0;
  if (/^\d+$/.test(d)) return Number(d);
  return d.split(':').reduce((acc, n) => acc * 60 + Number(n), 0);
};

// The feed doesn't flag Shorts, but on this channel they always carry hashtags in the title.
const isShort = (title, description) =>
  /#shorts?\b|#youtubeshorts?\b/i.test(`${title} ${description}`) ||
  (title.match(/#\w+/g) || []).length >= 2;

/** Clean up a hashtag-heavy Shorts title for display. */
const shortTitle = (title) => {
  const t = title.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  return t;
};

async function fetchYouTube() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`);
  if (!res.ok) throw new Error(`YouTube feed ${res.status}`);
  const xml = await res.text();
  const entries = xml.split('<entry>').slice(1);
  const episodes = [];
  const clips = [];

  for (const e of entries) {
    const id = tag(e, 'yt:videoId');
    const title = tag(e, 'title');
    const description = tag(e, 'media:description');
    const date = tag(e, 'published').slice(0, 10);
    const views = Number(attr(e, 'media:statistics', 'views')) || 0;

    if (isShort(title, description)) {
      clips.push({ platform: 'youtube', id, title: shortTitle(title), date, views });
    } else {
      episodes.push({
        id: `yt-${id}`,
        source: 'youtube',
        youtubeId: id,
        title,
        summary: summarise(description, title),
        date,
        duration: 0,
        thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        thumbLarge: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
      });
    }
  }
  return { episodes, clips };
}

async function fetchAudio() {
  const res = await fetch(RSS_URL);
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  const xml = await res.text();
  const showImage = attr(xml.split('<item>')[0], 'itunes:image', 'href');

  return xml
    .split('<item>')
    .slice(1)
    .map((item, i, all) => {
      const guid = tag(item, 'guid');
      return {
        id: `au-${guid.replace(/[^a-z0-9]/gi, '').slice(-12) || i}`,
        source: 'audio',
        number: all.length - i,
        title: tag(item, 'title').replace(/^🎬\s*/u, ''),
        summary: summarise(tag(item, 'description'), tag(item, 'title')),
        date: new Date(tag(item, 'pubDate')).toISOString().slice(0, 10),
        duration: toSeconds(tag(item, 'itunes:duration')),
        audioUrl: attr(item, 'enclosure', 'url'),
        thumb: attr(item, 'itunes:image', 'href') || showImage,
        url: tag(item, 'link'),
      };
    });
}

async function main() {
  let previous = { episodes: [], clips: [] };
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {}

  const [yt, audio] = await Promise.allSettled([fetchYouTube(), fetchAudio()]);
  if (yt.status === 'rejected') console.warn(`[content] YouTube skipped: ${yt.reason.message}`);
  if (audio.status === 'rejected') console.warn(`[content] RSS skipped: ${audio.reason.message}`);

  const keep = (source) => previous.episodes.filter((e) => e.source === source);
  const videoEps = yt.status === 'fulfilled' ? yt.value.episodes : keep('youtube');
  const audioEps = audio.status === 'fulfilled' ? audio.value : keep('audio');
  const ytClips = yt.status === 'fulfilled' ? yt.value.clips : previous.clips.filter((c) => c.platform === 'youtube');

  // Hand-picked TikTok clips go first: TikTok is the priority platform.
  let tiktok = [];
  try {
    tiktok = JSON.parse(await readFile(TIKTOK, 'utf8')).map((c) => ({ platform: 'tiktok', ...c }));
  } catch {}

  const episodes = [...videoEps, ...audioEps].sort((a, b) => b.date.localeCompare(a.date));
  const content = {
    updatedAt: new Date().toISOString(),
    episodes,
    clips: [...tiktok, ...ytClips],
  };

  await writeFile(OUT, `${JSON.stringify(content, null, 2)}\n`);
  console.log(
    `[content] ${videoEps.length} video + ${audioEps.length} audio episodes, ${content.clips.length} clips`,
  );
}

main().catch((err) => {
  console.warn(`[content] fetch failed, keeping existing content.json: ${err.message}`);
});
