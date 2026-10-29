import React from 'react';
import { Settings, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { NewsCategory } from '../types/news';
import { CATEGORIES } from '../data/categories';

interface HeaderProps {
  currentCategory: NewsCategory;
  dateStr: string;
  isDemo: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  dateStr,
  isDemo,
  isRefreshing,
  onRefresh,
  onOpenSettings,
}) => {
  const categoryInfo = CATEGORIES[currentCategory] || CATEGORIES.it;

  return (
    <header className="w-full max-w-5xl mx-auto h-14 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 select-none">
      {/* Brand Zone */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-sm shadow-indigo-500/20">
          2
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
            오늘둘
            <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">Daily Two</span>
          </span>
        </div>
      </div>

      {/* Middle Context: Date & Category */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="tabular-nums font-medium text-slate-300">{dateStr}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="font-medium text-slate-300">{categoryInfo.name}</span>
        {isDemo && (
          <span className="ml-1 text-[11px] font-medium text-amber-400 bg-amber-950/70 border border-amber-800/60 px-1.5 py-0.5 rounded">
            데모 모드
          </span>
        )}
      </div>

      {/* Action Zone */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="브리핑 새로고침"
          title="최신 뉴스 브리핑 새로고침"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="설정"
          title="카테고리 및 설정"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors active:scale-95"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
