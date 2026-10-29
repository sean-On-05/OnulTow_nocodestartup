import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full max-w-5xl mx-auto flex flex-col p-4 gap-4 animate-pulse">
      {/* Top Card Skeleton */}
      <div className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-16 h-4 bg-slate-800 rounded" />
          <div className="w-12 h-4 bg-slate-800 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          <div className="w-3/4 h-6 bg-slate-800 rounded" />
          <div className="w-1/2 h-6 bg-slate-800/60 rounded" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
          <div className="w-16 h-3 bg-slate-800 rounded" />
          <div className="w-24 h-3 bg-slate-800 rounded" />
        </div>
      </div>

      {/* Bottom Card Skeleton */}
      <div className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-16 h-4 bg-slate-800 rounded" />
          <div className="w-12 h-4 bg-slate-800 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          <div className="w-4/5 h-6 bg-slate-800 rounded" />
          <div className="w-2/3 h-6 bg-slate-800/60 rounded" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
          <div className="w-16 h-3 bg-slate-800 rounded" />
          <div className="w-24 h-3 bg-slate-800 rounded" />
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center py-1">
        <span className="text-xs text-slate-500 font-medium">
          오늘의 핵심 뉴스를 모아 10줄로 브리핑하는 중...
        </span>
      </div>
    </div>
  );
};
