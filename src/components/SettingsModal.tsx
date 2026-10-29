import React from 'react';
import { X, RefreshCw, Info, Check, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { CATEGORY_LIST } from '../data/categories';
import { NewsCategory } from '../types/news';

interface SettingsModalProps {
  isOpen: boolean;
  currentCategory: NewsCategory;
  briefingDate: string;
  updatedAt: string;
  isDemo: boolean;
  statusMessage?: string;
  onClose: () => void;
  onSelectCategory: (cat: NewsCategory) => void;
  onToggleDemoMode: () => void;
  onForceRefresh: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  currentCategory,
  briefingDate,
  updatedAt,
  isDemo,
  statusMessage,
  onClose,
  onSelectCategory,
  onToggleDemoMode,
  onForceRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white tracking-tight">서비스 설정</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status / Briefing Info */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/50 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>오늘의 브리핑 날짜</span>
            <span className="font-semibold text-slate-200 tabular-nums">{briefingDate}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>마지막 데이터 갱신 시각</span>
            <span className="font-semibold text-slate-200 tabular-nums">{updatedAt || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>데이터 모드</span>
            <span className={`font-semibold ${isDemo ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isDemo ? '데모 모드 (예시 뉴스)' : '실제 Google News RSS + Gemini AI'}
            </span>
          </div>
          {statusMessage && (
            <div className="pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Change Interest Category */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            관심 카테고리 변경
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_LIST.map((cat) => {
              const isSelected = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-left border text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/50 text-white font-semibold'
                      : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Mode Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">데모 모드 시연</span>
            <span className="text-[11px] text-slate-400">과제 평가 및 오프라인 검증용 가상 뉴스</span>
          </div>
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              isDemo
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isDemo ? '데모 켜짐' : '실제 모드'}
          </button>
        </div>

        {/* Force Refresh Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              onForceRefresh();
              onClose();
            }}
            className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>최신 브리핑 새로 수집하기</span>
          </button>
        </div>

        {/* Service Philosophy */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-300">오늘둘 (Daily Two)</p>
          <p className="text-[11px] text-slate-500 mt-1">
            "하루 1분, 세상을 10줄로 읽다."<br />
            대학 과제 제출용 비상업적 시연 프로젝트
          </p>
        </div>
      </div>
    </div>
  );
};
