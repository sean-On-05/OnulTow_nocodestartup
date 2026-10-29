import React from 'react';
import { ArrowUpRight, Check, Globe, MapPin } from 'lucide-react';
import { NewsItem } from '../types/news';
import { CATEGORIES } from '../data/categories';

interface NewsCardProps {
  item: NewsItem;
  cardRole: 'major' | 'interest';
  isRead: boolean;
  onSelect: (item: NewsItem) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  cardRole,
  isRead,
  onSelect,
}) => {
  const categoryInfo = CATEGORIES[item.category] || CATEGORIES.it;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={`relative w-full h-full rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-all duration-200 border border-slate-800/80 hover:border-slate-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-lg shadow-black/40 group`}
      style={{
        backgroundColor: categoryInfo.cardBg,
      }}
    >
      {/* Background Gradient & Mesh Depth */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${categoryInfo.bgGradient} opacity-90 transition-opacity group-hover:opacity-100`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

      {/* Top Metadata Row (Zero-Pill discipline: clean unboxed text with separators) */}
      <div className="relative z-10 flex items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {/* Section Kicker */}
          <span className="font-semibold text-slate-100 tracking-wide">
            {cardRole === 'major' ? '주요 브리핑' : '관심 브리핑'}
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          {/* Scope Indicator */}
          <span className="flex items-center gap-1 font-medium text-slate-300">
            {item.scope === 'domestic' ? (
              <>
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>국내</span>
              </>
            ) : (
              <>
                <Globe className="w-3 h-3 text-sky-400" />
                <span>해외</span>
              </>
            )}
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="text-slate-300">{item.categoryName}</span>
        </div>

        {/* Read Status Badge or Publisher */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="truncate max-w-[110px] sm:max-w-[160px]">{item.publisher}</span>
          {isRead && (
            <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">확인함</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: One-line Core Headline */}
      <div className="relative z-10 my-auto py-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-3 sm:line-clamp-2 text-balance group-hover:text-slate-100 transition-colors">
          {item.headline}
        </h2>
      </div>

      {/* Bottom Row: Hint & Action */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-300">
        <span className="text-slate-400 tabular-nums">
          {item.publishedAt ? item.publishedAt.split(' ')[1] || item.publishedAt : ''}
        </span>
        <div className="flex items-center gap-1 text-slate-200 font-medium group-hover:text-white transition-colors">
          <span>3줄 상세 보기</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
