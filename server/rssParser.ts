import { XMLParser } from 'fast-xml-parser';

export interface RawRssArticle {
  title: string;
  cleanTitle: string;
  link: string;
  pubDate: string;
  isoDate: string;
  source: string;
  description: string;
  scope: 'domestic' | 'global';
}

// Strip HTML tags and decode common HTML entities
export function cleanHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract publisher from "Article Title - Publisher Name" format
export function parseTitleAndSource(rawTitle: string, rawSource?: string): { title: string; source: string } {
  let title = cleanHtml(rawTitle);
  let source = rawSource ? cleanHtml(rawSource) : '';

  // Google News titles commonly end with " - Publisher"
  const lastDashIdx = title.lastIndexOf(' - ');
  if (lastDashIdx > 0) {
    if (!source) {
      source = title.substring(lastDashIdx + 3).trim();
    }
    title = title.substring(0, lastDashIdx).trim();
  } else {
    const lastBarIdx = title.lastIndexOf(' | ');
    if (lastBarIdx > 0) {
      if (!source) {
        source = title.substring(lastBarIdx + 3).trim();
      }
      title = title.substring(0, lastBarIdx).trim();
    }
  }

  if (!source) {
    source = 'Google News';
  }

  return { title, source };
}

// Format date to Asia/Seoul "YYYY-MM-DD HH:mm"
export function formatSeoulDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(d).replace(/\. /g, '-').replace('.', '');
  } catch {
    return dateStr;
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// Fetch and parse Google News RSS
export async function fetchGoogleNewsRss(url: string, scope: 'domestic' | 'global'): Promise<RawRssArticle[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[RSS] Failed to fetch ${url}: HTTP ${res.status}`);
      return [];
    }

    const xmlText = await res.text();
    const parsed = parser.parse(xmlText);

    const channel = parsed?.rss?.channel;
    if (!channel || !channel.item) {
      return [];
    }

    const items = Array.isArray(channel.item) ? channel.item : [channel.item];

    const results: RawRssArticle[] = [];

    for (const item of items) {
      const rawTitle = typeof item.title === 'string' ? item.title : '';
      if (!rawTitle) continue;

      const rawSource = typeof item.source === 'string' ? item.source : item.source?.['#text'] || '';
      const { title: cleanTitle, source } = parseTitleAndSource(rawTitle, rawSource);

      const rawLink = typeof item.link === 'string' ? item.link : item.link?.['#text'] || '';
      const pubDate = typeof item.pubDate === 'string' ? item.pubDate : '';
      const description = typeof item.description === 'string' ? cleanHtml(item.description) : '';

      results.push({
        title: rawTitle,
        cleanTitle,
        link: rawLink,
        pubDate: formatSeoulDate(pubDate),
        isoDate: pubDate,
        source,
        description,
        scope,
      });
    }

    return results;
  } catch (err: any) {
    console.error(`[RSS] Error fetching ${url}:`, err.message);
    return [];
  }
}

// Deduplicate articles by title token overlap
export function deduplicateArticles(articles: RawRssArticle[]): RawRssArticle[] {
  const seen: RawRssArticle[] = [];

  for (const article of articles) {
    const norm = article.cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, ' ')
      .trim();

    const words = new Set(norm.split(/\s+/).filter((w) => w.length >= 2));

    let isDupe = false;
    for (const prev of seen) {
      const prevNorm = prev.cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, ' ')
        .trim();
      const prevWords = new Set(prevNorm.split(/\s+/).filter((w) => w.length >= 2));

      // Check Jaccard overlap of words
      let overlap = 0;
      for (const w of words) {
        if (prevWords.has(w)) overlap++;
      }
      const similarity = overlap / Math.max(words.size, prevWords.size);
      if (similarity > 0.45) {
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      seen.push(article);
    }
  }

  return seen;
}
