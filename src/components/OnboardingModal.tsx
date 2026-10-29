import React, { useState } from 'react';
import { CATEGORY_LIST } from '../data/categories';
import { NewsCategory } from '../types/news';
import { Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (selectedCategory: NewsCategory) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [selected, setSelected] = useState<NewsCategory>('it');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between max-h-[92vh] overflow-y-auto">
        <div>
          {/* Brand & Slogan */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-600/30 mb-3">
              2
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              오늘둘 <span className="text-sm font-normal text-slate-400">Daily Two</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-indigo-400">
              하루 1분, 세상을 10줄로 읽다.
            </p>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed text-balance">
              세상을 놓치지 않되, 정보에 압도되지 않도록.<br />
              매일 엄선된 10개의 핵심 뉴스를 전달합니다.
            </p>
          </div>

          {/* Category Selector Grid */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              관심 카테고리를 선택해 주세요 (1개)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_LIST.map((cat) => {
                const isCurrent = selected === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelected(cat.id)}
                    className={`relative p-3 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-950/50 shadow-sm shadow-indigo-500/20 text-white'
                        : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-semibold">{cat.name}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.accentColor }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {cat.tagline}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onComplete(selected)}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm font-bold text-white shadow-lg shadow-indigo-600/30"
          >
            <span>오늘의 브리핑 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
