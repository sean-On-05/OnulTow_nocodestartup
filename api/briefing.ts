import type { IncomingMessage, ServerResponse } from 'http';
import { getDailyBriefing } from '../server/newsService';
import { NewsCategory } from '../src/types/news';

interface HandlerRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  method?: string;
  url?: string;
}

interface HandlerResponse extends ServerResponse {
  status: (code: number) => HandlerResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => this;
}

export default async function handler(req: any, res: any) {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const category = (req.query.category as NewsCategory) || 'it';
    const forceRefresh = req.query.refresh === 'true';

    const briefing = await getDailyBriefing(category, forceRefresh);
    return res.status(200).json(briefing);
  } catch (error: any) {
    console.error('[Vercel API] Error handling briefing:', error);
    return res.status(500).json({
      error: 'Failed to generate briefing',
      message: error.message || 'Unknown server error',
    });
  }
}
