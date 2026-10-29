import React from 'react';
import { CheckCircle2, RotateCcw, Calendar, BookOpen, Sparkles } from 'lucide-react';

interface CompletionViewProps {
  dateStr: string;
  categoryName: string;
  readCount: number;
  onRestart: () => void;
}

export const CompletionView: React.FC<CompletionViewProps> = ({
  dateStr,
  categoryName,
  readCount,
  onRestart,
}) => {
  return (
    <div className="w-full h-full max-w-xl mx-auto flex flex-col items-center justify-between p-6 sm:p-8 animate-fade-in text-center select-none">
      <div className="w-full my-auto flex flex-col items-center">
        {/* Calm Checkmark Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        {/* Primary Completion Messages */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          오늘의 브리핑 끝!
        </h1>
        <p className="mt-3 text-base text-slate-300 font-medium">
          세상의 흐름을 확인했어요.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          오늘은 여기까지.
        </p>

        {/* Summary Card */}
        <div className="mt-8 w-full max-w-sm p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>브리핑 날짜</span>
            </span>
            <span className="font-semibold text-slate-200 tabular-nums">{dateStr}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>확인한 브리핑</span>
            </span>
            <span className="font-semibold text-slate-200">
              5개 페이지 (주요 5 + {categoryName} 5)
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>상세 열람 뉴스</span>
            </span>
            <span className="font-semibold text-indigo-300 tabular-nums">
              {readCount}개 기사
            </span>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          내일 오전 새로운 브리핑으로 다시 만나요.
        </p>
      </div>

      {/* Restart Button */}
      <div className="w-full max-w-sm mt-4">
        <button
          type="button"
          onClick={onRestart}
          className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-indigo-400" />
          <span>처음부터 다시 보기</span>
        </button>
      </div>
    </div>
  );
};
