import { GoogleGenAI, Type } from '@google/genai';
import { RawRssArticle } from './rssParser';

export interface SummarizedArticle {
  index: number;
  headline: string; // 반드시 자연스러운 한국어 한 줄 핵심 제목
  what: string;     // ① 무슨 일이야? (반드시 한국어)
  why: string;      // ② 왜 중요해? (반드시 한국어)
  next: string;     // ③ 앞으로는? (반드시 한국어)
}

// Track whether a model hit 429 quota limit to avoid repeated failed calls
let isModel38RateLimited = false;

// Check if the text contains a meaningful amount of Korean Hangul characters
export function isNaturalKorean(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const hangulChars = text.match(/[\uac00-\ud7a3]/g);
  // Must contain at least 4 Hangul characters
  return Boolean(hangulChars && hangulChars.length >= 4);
}

// Validate that all fields in the summarized article are written in genuine Korean
export function isValidKoreanSummary(item: SummarizedArticle): boolean {
  return (
    typeof item.index === 'number' &&
    isNaturalKorean(item.headline) &&
    isNaturalKorean(item.what) &&
    isNaturalKorean(item.why) &&
    isNaturalKorean(item.next)
  );
}

// Timeout helper for Gemini API calls
async function withTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Clean error message without exposing API key
function sanitizeError(err: any): string {
  if (!err) return 'Unknown error';
  const msg = err.message || String(err);
  return msg.replace(/[a-zA-Z0-9_-]{30,}/g, '[REDACTED_KEY]');
}

// Check if error is 429 quota limit
function isRateLimitError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code;
  const msg = (err.message || '').toLowerCase();
  return status === 429 || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('429');
}

// Core execution helper with prompt and schema
async function callGeminiForSummaries(
  ai: GoogleGenAI,
  articlesToSummarize: Array<RawRssArticle & { index: number; roleLabel: string }>,
  categoryName: string,
  modelName: string
): Promise<Map<number, SummarizedArticle>> {
  const promptItems = articlesToSummarize.map((a) => {
    return `[기사 ${a.index} (${a.roleLabel}, 출처: ${a.source}, ${a.scope === 'domestic' ? '국내 언론' : '해외 외신 (영어)'})]
원문 제목: ${a.cleanTitle}
원문 설명: ${a.description || '내용 요약 없음'}`;
  }).join('\n\n');

  const systemInstruction = `당신은 '오늘둘 (Daily Two)' 뉴스 브리핑 서비스의 수석 에디터입니다.
사용자에게 제공되는 모든 요약은 **반드시 100% 매끄럽고 자연스러운 표준 한국어(Korean)**로만 작성해야 합니다.

[절대 규칙 - 한국어 필수]
1. 해외 외신 기사의 원문이 영어(English)이더라도, 출력되는 'headline', 'what', 'why', 'next'는 절대로 영어 문장 그대로 두지 말고 완벽한 한국어로 번역 및 요약하십시오.
2. 카드에 들어갈 'headline'(한 줄 핵심 제목)은 영어 원문 제목을 복사하지 말고, 핵심 사실을 담은 세련된 한국어 한 문장으로 압축하십시오.
3. 고유명사(Apple, Google, NVIDIA, TSMC, NASA, Fed 등)는 필요한 경우 원어 표기를 병기하거나 포함할 수 있으나, 문장 서술어와 전체 설명은 반드시 완성된 한국어여야 합니다.
4. 요약 구성:
   - headline: 자극적이지 않고 객관적인 사실 중심의 한국어 한 줄 제목
   - what (① 무슨 일이야?): 실제로 일어난 핵심 사실이나 발표 내용 (1~2문장, 한국어)
   - why (② 왜 중요해?): 해당 사안이 갖는 사회, 경제, 기술적 파급 효과 (1~2문장, 한국어)
   - next (③ 앞으로는?): 향후 예정된 일정이나 확인해야 할 변화 (1~2문장, 한국어)
5. RSS 원문 정보가 부족한 경우 억지로 상상해서 채우지 말고, 원문에 나타난 사실만을 명확히 기술하십시오.`;

  const contents = `사용자 관심 카테고리: ${categoryName}
다음 기사 목록을 읽고, 각각의 기사를 철저하게 한국어로 번역 및 요약하여 JSON 배열로 반환하십시오:

${promptItems}`;

  const generatePromise = ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction,
      temperature: 0.15,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            index: { type: Type.INTEGER, description: '기사 번호' },
            headline: { type: Type.STRING, description: '반드시 자연스러운 한국어 한 줄 핵심 제목' },
            what: { type: Type.STRING, description: '무슨 일이야? 실제 사건 (반드시 한국어)' },
            why: { type: Type.STRING, description: '왜 중요해? 배경 및 의미 (반드시 한국어)' },
            next: { type: Type.STRING, description: '앞으로는? 전망 및 과제 (반드시 한국어)' },
          },
          required: ['index', 'headline', 'what', 'why', 'next'],
        },
      },
    },
  });

  const timeoutLimit = modelName === 'gemini-3.8-flash' ? 7000 : 16000;
  const response = await withTimeout(generatePromise, timeoutLimit);
  const text = response.text?.trim();
  if (!text) return new Map();

  const parsed = JSON.parse(text) as SummarizedArticle[];
  const resultMap = new Map<number, SummarizedArticle>();

  for (const item of parsed) {
    if (isValidKoreanSummary(item)) {
      resultMap.set(item.index, item);
    } else {
      console.warn(`[Gemini] Article ${item.index} failed Korean validation (headline: "${item.headline}")`);
    }
  }

  return resultMap;
}

export async function summarizeArticlesWithGemini(
  articles: Array<RawRssArticle & { index: number; roleLabel: string }>,
  categoryName: string
): Promise<Map<number, SummarizedArticle> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.log('[Gemini] No active GEMINI_API_KEY found.');
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Decide primary model: if 3.8-flash was previously rate-limited on this server, use 3.1-flash-lite directly
  const preferredModel = isModel38RateLimited ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

  try {
    console.log(`[Gemini] Summarizing ${articles.length} articles using ${preferredModel}...`);
    const resultMap = await callGeminiForSummaries(ai, articles, categoryName, preferredModel);

    // If some articles failed Korean check, try one retry with gemini-3.1-flash-lite
    const missingArticles = articles.filter((a) => !resultMap.has(a.index));
    if (missingArticles.length > 0) {
      console.log(`[Gemini] Retrying ${missingArticles.length} unsummarized articles with gemini-3.1-flash-lite...`);
      try {
        const retryMap = await callGeminiForSummaries(ai, missingArticles, categoryName, 'gemini-3.1-flash-lite');
        for (const [idx, item] of retryMap.entries()) {
          resultMap.set(idx, item);
        }
      } catch (retryErr: any) {
        console.warn('[Gemini] Retry attempt failed:', sanitizeError(retryErr));
      }
    }

    return resultMap.size > 0 ? resultMap : null;
  } catch (primaryErr: any) {
    const isRateLimit = isRateLimitError(primaryErr);
    console.warn(`[Gemini] ${preferredModel} failed (${sanitizeError(primaryErr)})`);

    // If 3.8-flash failed or timed out, permanently mark it limited so we stay on fast 3.1-flash-lite
    if (preferredModel === 'gemini-3.8-flash') {
      isModel38RateLimited = true;
    }

    // If primary model failed, fallback immediately to gemini-3.1-flash-lite
    if (preferredModel !== 'gemini-3.1-flash-lite') {
      console.log('[Gemini] Falling back to gemini-3.1-flash-lite...');
      try {
        const fallbackMap = await callGeminiForSummaries(ai, articles, categoryName, 'gemini-3.1-flash-lite');
        return fallbackMap.size > 0 ? fallbackMap : null;
      } catch (fallbackErr: any) {
        console.error('[Gemini] Fallback to gemini-3.1-flash-lite also failed:', sanitizeError(fallbackErr));
        return null;
      }
    }

    return null;
  }
}
