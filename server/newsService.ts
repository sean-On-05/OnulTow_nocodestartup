import { DailyBriefing, NewsCategory, NewsItem } from '../src/types/news';
import { CATEGORIES } from '../src/data/categories';
import { getDemoBriefing } from '../src/data/demoNews';
import { deduplicateArticles, fetchGoogleNewsRss, RawRssArticle } from './rssParser';
import { summarizeArticlesWithGemini, SummarizedArticle } from './geminiSummarizer';

// Server-side in-memory cache
// Key: `${date}_${category}`
const briefingCache = new Map<string, { briefing: DailyBriefing; cachedAt: number }>();

function getSeoulTodayString(): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\. /g, '-')
    .replace('.', '');
}

function getCategoryRssUrl(category: NewsCategory): string {
  const cat = CATEGORIES[category] || CATEGORIES.it;
  if (cat.rssTopic) {
    return `https://news.google.com/rss/headlines/section/topic/${cat.rssTopic}?hl=ko&gl=KR&ceid=KR:ko`;
  }
  const query = encodeURIComponent(cat.rssSearchQuery || cat.name);
  return `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
}

export async function getDailyBriefing(
  category: NewsCategory = 'it',
  forceRefresh = false
): Promise<DailyBriefing> {
  const todayStr = getSeoulTodayString();
  const cacheKey = `${todayStr}_${category}`;

  if (!forceRefresh && briefingCache.has(cacheKey)) {
    const cached = briefingCache.get(cacheKey)!;
    // Cache valid for 3 hours within the same date
    if (Date.now() - cached.cachedAt < 3 * 60 * 60 * 1000) {
      console.log(`[NewsService] Returning cached briefing for ${cacheKey}`);
      return cached.briefing;
    }
  }

  const categoryInfo = CATEGORIES[category] || CATEGORIES.it;
  console.log(`[NewsService] Fetching fresh RSS feeds for date=${todayStr}, category=${category}...`);

  try {
    const domesticMainUrl = 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko';
    const globalMainUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
    const categoryUrl = getCategoryRssUrl(category);

    const [domesticArticles, globalArticles, categoryArticles] = await Promise.all([
      fetchGoogleNewsRss(domesticMainUrl, 'domestic'),
      fetchGoogleNewsRss(globalMainUrl, 'global'),
      fetchGoogleNewsRss(categoryUrl, 'domestic'),
    ]);

    const hasEnoughData = domesticArticles.length >= 2 && (globalArticles.length >= 2 || categoryArticles.length >= 3);

    if (!hasEnoughData) {
      console.warn('[NewsService] Insufficient RSS data retrieved. Falling back to Demo mode.');
      const demo = getDemoBriefing(category);
      demo.statusMessage = 'Google News RSS 연결 대기 중으로 안전 모드(시연용 데이터)가 제공되었습니다.';
      return demo;
    }

    // 2. Deduplicate raw streams
    const dedupedDomestic = deduplicateArticles(domesticArticles);
    const dedupedGlobal = deduplicateArticles(globalArticles);
    const dedupedCategory = deduplicateArticles(categoryArticles);

    // 3. Assemble 5 Major Candidates: 2 domestic + 2 global (foreign news like NPR, BBC) + 1 top cross-border
    const majorCandidates: Array<RawRssArticle & { index: number; roleLabel: string }> = [];
    if (dedupedDomestic[0]) majorCandidates.push({ ...dedupedDomestic[0], index: 1, roleLabel: '국내 주요 뉴스 1' });
    if (dedupedDomestic[1]) majorCandidates.push({ ...dedupedDomestic[1], index: 2, roleLabel: '국내 주요 뉴스 2' });
    if (dedupedGlobal[0]) majorCandidates.push({ ...dedupedGlobal[0], index: 3, roleLabel: '해외 주요 외신 1' });
    if (dedupedGlobal[1]) majorCandidates.push({ ...dedupedGlobal[1], index: 4, roleLabel: '해외 주요 외신 2' });
    if (dedupedDomestic[2] || dedupedGlobal[2]) {
      const extra = dedupedDomestic[2] || dedupedGlobal[2];
      majorCandidates.push({ ...extra, index: 5, roleLabel: '국내외 핵심 뉴스 5' });
    }

    // 4. Assemble 5 Interest Candidates from user selected category
    const majorTitles = new Set(majorCandidates.map((m) => m.cleanTitle.toLowerCase()));
    const interestCandidates: Array<RawRssArticle & { index: number; roleLabel: string }> = [];

    for (const item of dedupedCategory) {
      if (majorTitles.has(item.cleanTitle.toLowerCase())) continue;
      interestCandidates.push({
        ...item,
        index: interestCandidates.length + 1,
        roleLabel: `${categoryInfo.name} 관심 뉴스 ${interestCandidates.length + 1}`,
      });
      if (interestCandidates.length >= 5) break;
    }

    // Supplement interest news if needed
    if (interestCandidates.length < 5) {
      for (const item of [...dedupedDomestic.slice(3), ...dedupedGlobal.slice(3)]) {
        if (majorTitles.has(item.cleanTitle.toLowerCase())) continue;
        interestCandidates.push({
          ...item,
          index: interestCandidates.length + 1,
          roleLabel: `${categoryInfo.name} 관련 뉴스 ${interestCandidates.length + 1}`,
        });
        if (interestCandidates.length >= 5) break;
      }
    }

    // 5. Call Gemini AI Summarizer in 2 optimal parallel batches (5 items each)
    console.log(`[NewsService] Requesting Gemini summaries for 5 Major + 5 Interest articles in parallel...`);
    const [majorSummaryMap, interestSummaryMap] = await Promise.all([
      summarizeArticlesWithGemini(majorCandidates, '종합 뉴스'),
      summarizeArticlesWithGemini(interestCandidates, categoryInfo.name),
    ]);

    // Helper to format a clean, validated NewsItem
    const toNewsItem = (
      raw: RawRssArticle,
      summary: SummarizedArticle | undefined,
      defaultCategory: NewsCategory
    ): NewsItem => {
      // For foreign news: summary must exist and be Korean.
      const isGlobal = raw.scope === 'global';
      const headline = summary?.headline || raw.cleanTitle;

      const what = summary?.what || (
        raw.description
          ? (raw.description.length > 130 ? raw.description.slice(0, 130) + '...' : raw.description)
          : `${raw.source}에서 보도한 핵심 보도입니다.`
      );

      const why = summary?.why || (
        isGlobal
          ? '글로벌 외교 및 국제 정세의 주요 흐름을 파악하는 핵심 사안입니다.'
          : `국내 ${categoryInfo.name} 생태계의 주요 이슈로 관련 시장과 공공의 관심이 집중되고 있습니다.`
      );

      const next = summary?.next || (
        isGlobal
          ? '향후 국제 사회의 반응과 각국 정부의 후속 조치를 주시할 필요가 있습니다.'
          : '정부 유관 부처 및 시장의 후속 대응 조치와 산업적 파급 효과를 지속 확인할 필요가 있습니다.'
      );

      return {
        id: `news-${raw.scope}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        scope: raw.scope,
        category: (raw as any).category || defaultCategory,
        categoryName: CATEGORIES[(raw as any).category as NewsCategory]?.name || (isGlobal ? '국제·외교' : categoryInfo.name),
        headline,
        originalTitle: raw.cleanTitle,
        summary3Lines: {
          what,
          why,
          next,
        },
        publisher: raw.source,
        publishedAt: raw.pubDate,
        originalUrl: raw.link,
        isDemo: false,
      };
    };

    // 6. Build the 5 Major News items
    const selectedMajorNews: NewsItem[] = majorCandidates.map((m) => {
      const summary = majorSummaryMap?.get(m.index);
      return toNewsItem(m, summary, m.scope === 'global' ? 'world' : 'politics');
    });

    // 7. Build the 5 Interest News items
    const selectedInterestNews: NewsItem[] = interestCandidates.map((item) => {
      const summary = interestSummaryMap?.get(item.index);
      return toNewsItem(item, summary, category);
    });

    // 8. Partition into 5 pages: (Major [0..4], Interest [0..4])
    const pages = [0, 1, 2, 3, 4].map((i) => ({
      pageNumber: i + 1,
      majorNews: selectedMajorNews[i] || selectedMajorNews[0],
      interestNews: selectedInterestNews[i] || selectedInterestNews[0],
    }));

    const briefing: DailyBriefing = {
      date: todayStr,
      category,
      categoryName: categoryInfo.name,
      pages,
      updatedAt: new Date().toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isDemo: false,
      statusMessage: (majorSummaryMap && interestSummaryMap)
        ? '실제 RSS 수집 및 Gemini AI 한국어 요약 완료'
        : '실제 RSS 수집 완료 (정제 요약)',
    };

    // Store in cache
    briefingCache.set(cacheKey, { briefing, cachedAt: Date.now() });

    return briefing;
  } catch (error: any) {
    console.error('[NewsService] Fatal error while fetching briefing:', error);
    const demo = getDemoBriefing(category);
    demo.statusMessage = '서버 처리 중 오류로 인해 안전 모드(시연용 데이터)가 제공되었습니다.';
    return demo;
  }
}
