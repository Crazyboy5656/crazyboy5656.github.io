import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { OlympiadSubject, UserProgress, QuestionAttempt, StreakData, AppContextType } from '../types';
import { LOCAL_STORAGE_KEYS, IS_API_KEY_CONFIGURED } from '../constants';

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [olympiadSubject, setOlympiadSubjectStorage] = useLocalStorage<OlympiadSubject | null>(LOCAL_STORAGE_KEYS.SUBJECT, null);
  const [progress, setProgress] = useLocalStorage<UserProgress>(LOCAL_STORAGE_KEYS.PROGRESS, { attempts: [] });
  const [streakData, setStreakData] = useLocalStorage<StreakData>(LOCAL_STORAGE_KEYS.STREAK, { currentStreak: 0, lastActivityDate: null });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiKeyAvailable = IS_API_KEY_CONFIGURED; // Simulating check

  const setOlympiadSubject = (subject: OlympiadSubject | null) => {
    setOlympiadSubjectStorage(subject);
    // Clear all daily question caches when subject changes or is cleared
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(LOCAL_STORAGE_KEYS.DAILY_QUESTIONS + '_')) { // Clears keys like 'olympiad_daily_questions_Mathematics' and 'olympiad_daily_questions_Mathematics_2024-01-01'
        localStorage.removeItem(key);
      }
    });
    // Also remove the old generic key if it was ever used
    localStorage.removeItem(LOCAL_STORAGE_KEYS.DAILY_QUESTIONS);
  };

  const addAttempt = useCallback((newAttemptData: Omit<QuestionAttempt, 'id' | 'timestamp'>): QuestionAttempt => {
    const attemptWithMetadata: QuestionAttempt = {
      ...newAttemptData,
      id: Date.now().toString() + Math.random().toString(36).substring(2,9), // more unique id
      timestamp: Date.now(),
    };
    setProgress(prev => ({
      ...prev,
      attempts: [...prev.attempts, attemptWithMetadata],
    }));
    return attemptWithMetadata;
  }, [setProgress]);

  const updateStreakOnActivity = useCallback(() => {
    setStreakData(prev => {
      const today = new Date().toISOString().split('T')[0];
      if (prev.lastActivityDate === today) {
        return prev; // Already active today
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (prev.lastActivityDate === yesterdayStr) {
        return { currentStreak: prev.currentStreak + 1, lastActivityDate: today };
      }
      return { currentStreak: 1, lastActivityDate: today };
    });
  }, [setStreakData]);

  useEffect(() => {
    if (!apiKeyAvailable) {
      setError("Gemini API Key is not configured. Please set the API_KEY environment variable.");
    }
  }, [apiKeyAvailable]);


  return (
    <AppContext.Provider value={{
      olympiadSubject,
      setOlympiadSubject,
      progress,
      addAttempt,
      streakData,
      updateStreakOnActivity,
      isLoading,
      setIsLoading,
      error,
      setError,
      apiKeyAvailable
    }}>
      {children}
    </AppContext.Provider>
  );
};