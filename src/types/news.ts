export type NewsCategory =
  | 'it'
  | 'economy'
  | 'politics'
  | 'world'
  | 'science'
  | 'culture'
  | 'sports'
  | 'lifestyle';

export interface CategoryInfo {
  id: NewsCategory;
  name: string;
  tagline: string;
  rssTopic?: string;
  rssSearchQuery?: string;
  colorName: string;
  bgGradient: string;
  accentColor: string;
  cardBg: string;
}

export interface NewsItem {
  id: string;
  scope: 'domestic' | 'global'; // 'domestic' (국내) | 'global' (해외)
  category: NewsCategory;
  categoryName: string;
  headline: string; // 한 줄 핵심 제목 (반드시 한국어)
  originalTitle?: string; // 해외 기사의 경우 영문 원문 제목 (원본 보관용)
  summary3Lines: {
    what: string; // ① 무슨 일이야? (반드시 한국어)
    why: string; // ② 왜 중요해? (반드시 한국어)
    next: string; // ③ 앞으로는? (반드시 한국어)
  };
  publisher: string; // 언론사
  publishedAt: string; // 발행 일시 (한국 시간 기준)
  originalUrl: string; // 원문 기사 링크
  isDemo?: boolean;
  hasTranslationError?: boolean;
}

export interface BriefingPage {
  pageNumber: number; // 1 ~ 5
  majorNews: NewsItem; // 국내외 주요 뉴스 1개
  interestNews: NewsItem; // 사용자 관심 카테고리 뉴스 1개
}

export interface DailyBriefing {
  date: string; // YYYY-MM-DD (Asia/Seoul)
  category: NewsCategory;
  categoryName: string;
  pages: BriefingPage[]; // 5 pages (10 news total)
  updatedAt: string;
  isDemo: boolean;
  statusMessage?: string;
}

export interface UserPreferences {
  category: NewsCategory;
  hasCompletedOnboarding: boolean;
  completedBriefingDates: string[]; // dates on which briefing was finished
  readNewsIds: string[]; // IDs of news that user clicked to read details
  useDemoMode: boolean; // Manual demo mode toggle
}
