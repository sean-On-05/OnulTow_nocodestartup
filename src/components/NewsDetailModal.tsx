import React, { useEffect } from 'react';
import { X, ExternalLink, Globe, MapPin, Building2, Calendar, HelpCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { NewsItem } from '../types/news';
import { CATEGORIES } from '../data/categories';

interface NewsDetailModalProps {
  item: NewsItem | null;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock body scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  const categoryInfo = CATEGORIES[item.category] || CATEGORIES.it;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-news-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Close Button */}
        <div>
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                {item.scope === 'domestic' ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>국내</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>해외</span>
                  </>
                )}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-medium text-slate-300">{item.categoryName}</span>
              {item.isDemo && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-amber-400 font-medium text-[11px]">시연용 데이터</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Headline */}
          <h2
            id="modal-news-title"
            className="mt-4 text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug"
          >
            {item.headline}
          </h2>

          {/* Publisher & Published Date */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{item.publisher}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="tabular-nums">{item.publishedAt}</span>
            </div>
          </div>

          {/* Original English Title (for foreign news) */}
          {item.scope === 'global' && item.originalTitle && item.originalTitle !== item.headline && (
            <div className="mt-2 text-[11px] text-slate-500 font-mono line-clamp-2">
              <span className="text-slate-400 font-sans">원문 제목:</span> {item.originalTitle}
            </div>
          )}

          {/* 3-Line Structured Breakdown */}
          <div className="mt-6 space-y-4">
            {/* ① 무슨 일이야? */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1.5">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>① 무슨 일이야?</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {item.summary3Lines.what}
              </p>
            </div>

            {/* ② 왜 중요해? */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>② 왜 중요해?</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {item.summary3Lines.why}
              </p>
            </div>

            {/* ③ 앞으로는? */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1.5">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>③ 앞으로는?</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {item.summary3Lines.next}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons: 원문 기사 보기 & 닫기 */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20"
          >
            <span>원문 기사 보기</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all text-sm font-medium text-slate-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
