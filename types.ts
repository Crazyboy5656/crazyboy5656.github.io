
export enum OlympiadSubject {
  MATH = "Mathematics",
  PHYSICS = "Physics",
  CHEMISTRY = "Chemistry",
  INFORMATICS = "Informatics",
}

export interface DailyQuestion {
  id: string;
  text: string;
  subject: OlympiadSubject;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  questionText: string;
  solutionAttempt: string;
  isCorrect: boolean; // This will be determined by AI or simplified logic
  feedback: ChatMessage[]; // AI feedback and follow-up conversation
  timestamp: number;
  subject: OlympiadSubject;
}

export interface UserProgress {
  attempts: QuestionAttempt[];
}

export interface StreakData {
  currentStreak: number;
  lastActivityDate: string | null; // ISO date string YYYY-MM-DD
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface AppContextType {
  olympiadSubject: OlympiadSubject | null;
  setOlympiadSubject: (subject: OlympiadSubject | null) => void;
  progress: UserProgress;
  addAttempt: (attempt: Omit<QuestionAttempt, 'id' | 'timestamp'>) => QuestionAttempt;
  streakData: StreakData;
  updateStreakOnActivity: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  apiKeyAvailable: boolean;
}
