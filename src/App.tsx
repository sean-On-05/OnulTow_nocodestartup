import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyBriefing, NewsCategory, NewsItem, UserPreferences } from './types/news';
import { getUserPreferences, markDateBriefingCompleted, markNewsAsRead, saveUserPreferences } from './utils/storage';
import { getDemoBriefing } from './data/demoNews';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { NewsDetailModal } from './components/NewsDetailModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { CompletionView } from './components/CompletionView';
import { LoadingSkeleton } from './components/LoadingSkeleton';

export default function App() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => getUserPreferences());
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1); // 1 ~ 5 (or 6 for completion)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Touch tracking for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Fetch daily briefing
  const loadBriefing = useCallback(async (category: NewsCategory, forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (prefs.useDemoMode) {
        // Explicit demo mode requested by user
        setTimeout(() => {
          const demo = getDemoBriefing(category);
          setBriefing(demo);
          setIsLoading(false);
          setIsRefreshing(false);
        }, 300);
        return;
      }

      const res = await fetch(`/api/briefing?category=${category}${forceRefresh ? '&refresh=true' : ''}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: DailyBriefing = await res.json();
      setBriefing(data);
    } catch (err) {
      console.warn('API fetch failed, fallback to Demo Briefing:', err);
      const demo = getDemoBriefing(category);
      demo.statusMessage = '네트워크 통신 불안정으로 인해 오프라인 시연 모드로 전환되었습니다.';
      setBriefing(demo);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [prefs.useDemoMode]);

  // Initial load
  useEffect(() => {
    loadBriefing(prefs.category);
  }, [prefs.category, prefs.useDemoMode, loadBriefing]);

  // Page navigation handlers
  const goToNextPage = useCallback(() => {
    if (currentPage < 5) {
      setCurrentPage((prev) => prev + 1);
    } else if (currentPage === 5) {
      // Transition to completion screen
      setCurrentPage(6);
      if (briefing?.date) {
        markDateBriefingCompleted(briefing.date);
        setPrefs((prev) => ({
          ...prev,
          completedBriefingDates: [...prev.completedBriefingDates, briefing.date],
        }));
      }
    }
  }, [currentPage, briefing?.date]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectedNews || isSettingsOpen || !prefs.hasCompletedOnboarding) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (selectedNews || isSettingsOpen || !prefs.hasCompletedOnboarding) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Verify gesture is primarily horizontal
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        // Swiped Left -> Next page
        goToNextPage();
      } else {
        // Swiped Right -> Prev page
        goToPrevPage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedNews || isSettingsOpen || !prefs.hasCompletedOnboarding) return;
      if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNews, isSettingsOpen, prefs.hasCompletedOnboarding, goToNextPage, goToPrevPage]);

  // Card selection
  const handleSelectNews = (item: NewsItem) => {
    setSelectedNews(item);
    markNewsAsRead(item.id);
    setPrefs((prev) => ({
      ...prev,
      readNewsIds: prev.readNewsIds.includes(item.id) ? prev.readNewsIds : [...prev.readNewsIds, item.id],
    }));
  };

  // Onboarding completion
  const handleCompleteOnboarding = (chosenCategory: NewsCategory) => {
    const updated = saveUserPreferences({
      category: chosenCategory,
      hasCompletedOnboarding: true,
    });
    setPrefs(updated);
    loadBriefing(chosenCategory);
  };

  // Category switch from settings
  const handleSelectCategory = (cat: NewsCategory) => {
    const updated = saveUserPreferences({ category: cat });
    setPrefs(updated);
    setCurrentPage(1);
    loadBriefing(cat);
  };

  // Demo mode toggle
  const handleToggleDemoMode = () => {
    const nextVal = !prefs.useDemoMode;
    const updated = saveUserPreferences({ useDemoMode: nextVal });
    setPrefs(updated);
    setCurrentPage(1);
  };

  // Current page data
  const currentPageData = briefing?.pages?.find((p) => p.pageNumber === currentPage);

  // Today's formatted date
  const displayDate = briefing?.date || new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());

  return (
    <div
      className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header */}
      <Header
        currentCategory={prefs.category}
        dateStr={displayDate}
        isDemo={Boolean(briefing?.isDemo)}
        isRefreshing={isRefreshing}
        onRefresh={() => loadBriefing(prefs.category, true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-4 md:p-6 overflow-hidden flex flex-col relative">
        {isLoading ? (
          <LoadingSkeleton />
        ) : currentPage === 6 ? (
          <CompletionView
            dateStr={displayDate}
            categoryName={briefing?.categoryName || '관심'}
            readCount={prefs.readNewsIds.length}
            onRestart={() => setCurrentPage(1)}
          />
        ) : currentPageData ? (
          <div className="flex-1 w-full h-full flex flex-col md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden animate-fade-in">
            {/* Top Half (Mobile) / Left Half (Desktop): Domestic & Global Major News */}
            <div className="flex-1 md:h-full min-h-0">
              <NewsCard
                item={currentPageData.majorNews}
                cardRole="major"
                isRead={prefs.readNewsIds.includes(currentPageData.majorNews.id)}
                onSelect={handleSelectNews}
              />
            </div>

            {/* Bottom Half (Mobile) / Right Half (Desktop): User Interest News */}
            <div className="flex-1 md:h-full min-h-0">
              <NewsCard
                item={currentPageData.interestNews}
                cardRole="interest"
                isRead={prefs.readNewsIds.includes(currentPageData.interestNews.id)}
                onSelect={handleSelectNews}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-slate-400 text-sm">브리핑 데이터를 불러오지 못했습니다.</p>
            <button
              onClick={() => loadBriefing(prefs.category, true)}
              className="mt-3 px-4 py-2 bg-indigo-600 rounded-lg text-xs font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation & Indicator Bar (Visible on pages 1~5) */}
      {!isLoading && currentPage >= 1 && currentPage <= 5 && (
        <footer className="w-full max-w-5xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between border-t border-slate-900 bg-slate-950/90 backdrop-blur-sm z-20">
          {/* Previous Page Button */}
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            aria-label="이전 페이지"
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors py-2 px-2.5 rounded-lg active:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">이전</span>
          </button>

          {/* Page Dots & Numbers */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  aria-label={`페이지 ${pageNum}`}
                  className={`transition-all duration-200 rounded-full ${
                    currentPage === pageNum
                      ? 'w-6 h-2 bg-indigo-500 shadow-sm shadow-indigo-500/50'
                      : 'w-2 h-2 bg-slate-800 hover:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-400 tabular-nums">
              {currentPage} <span className="text-slate-600 font-normal">/</span> 5
            </span>
          </div>

          {/* Next Page / Complete Button */}
          <button
            type="button"
            onClick={goToNextPage}
            aria-label={currentPage === 5 ? '브리핑 완료' : '다음 페이지'}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors py-2 px-2.5 rounded-lg active:bg-slate-800"
          >
            <span>{currentPage === 5 ? '완료' : '다음'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      )}

      {/* News Detail Modal */}
      <NewsDetailModal
        item={selectedNews}
        onClose={() => setSelectedNews(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        currentCategory={prefs.category}
        briefingDate={displayDate}
        updatedAt={briefing?.updatedAt || ''}
        isDemo={Boolean(briefing?.isDemo)}
        statusMessage={briefing?.statusMessage}
        onClose={() => setIsSettingsOpen(false)}
        onSelectCategory={handleSelectCategory}
        onToggleDemoMode={handleToggleDemoMode}
        onForceRefresh={() => loadBriefing(prefs.category, true)}
      />

      {/* Onboarding Modal (Shown on first visit) */}
      <OnboardingModal
        isOpen={!prefs.hasCompletedOnboarding}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}
