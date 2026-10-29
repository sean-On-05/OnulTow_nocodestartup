import { NewsCategory, UserPreferences } from '../types/news';

const STORAGE_KEY = 'dailytwo_user_prefs_v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  category: 'it',
  hasCompletedOnboarding: false,
  completedBriefingDates: [],
  readNewsIds: [],
  useDemoMode: false,
};

export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch (err) {
    console.error('Failed to parse user preferences from localStorage:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(partial: Partial<UserPreferences>): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save user preferences to localStorage:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function markNewsAsRead(newsId: string): void {
  const current = getUserPreferences();
  if (!current.readNewsIds.includes(newsId)) {
    saveUserPreferences({
      readNewsIds: [...current.readNewsIds, newsId],
    });
  }
}

export function markDateBriefingCompleted(dateStr: string): void {
  const current = getUserPreferences();
  if (!current.completedBriefingDates.includes(dateStr)) {
    saveUserPreferences({
      completedBriefingDates: [...current.completedBriefingDates, dateStr],
    });
  }
}
