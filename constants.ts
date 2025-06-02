
import { OlympiadSubject } from './types';

export const OLYMPIAD_SUBJECTS: OlympiadSubject[] = [
  OlympiadSubject.MATH,
  OlympiadSubject.PHYSICS,
  OlympiadSubject.CHEMISTRY,
  OlympiadSubject.INFORMATICS,
];

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
// export const GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002'; // Not used in this version for image generation

export const LOCAL_STORAGE_KEYS = {
  SUBJECT: 'olympiad_subject',
  PROGRESS: 'olympiad_progress',
  STREAK: 'olympiad_streak',
  DAILY_QUESTIONS: 'olympiad_daily_questions',
};

export const APP_NAME = "Olympiad AI Prep Tutor";

// Placeholder for API Key check. In a real app, process.env.API_KEY would be checked.
// For this environment, we assume it's available if not explicitly undefined.
export const IS_API_KEY_CONFIGURED = typeof process.env.API_KEY === 'string' && process.env.API_KEY.length > 0;

