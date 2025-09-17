export const TIMER_STATUS = {
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
} as const;

export const XP_REWARDS = {
  TIMER_STARTED: 5,
  TIMER_COMPLETED: 15,
  PROJECT_CREATED: 10,
  TASK_CREATED: 5,
  DAILY_GOAL: 25,
  STREAK_BONUS: 50,
  LEVEL_UP: 100,
} as const;

export const ACHIEVEMENT_TYPES = {
  TIME_BASED: 'time',
  TASK_BASED: 'tasks',
  STREAK_BASED: 'streak',
  SPECIAL: 'special',
} as const;

export const CHALLENGE_TYPES = {
  TIME: 'time',
  TASKS: 'tasks',
  STREAK: 'streak',
  FOCUS: 'focus',
} as const;

export const API_LIMITS = {
  MAX_TIMERS_PER_PAGE: 50,
  MAX_PROJECTS_PER_USER: 100,
  MAX_TASKS_PER_PROJECT: 200,
  MAX_BULK_ENTRIES: 100,
} as const;

export const VALIDATION_RULES = {
  MIN_TIMER_DURATION: 60000, // 1 minute in ms
  MAX_TIMER_DURATION: 24 * 60 * 60 * 1000, // 24 hours in ms
  MAX_NOTE_LENGTH: 500,
  MAX_PROJECT_NAME_LENGTH: 100,
  MAX_TASK_TITLE_LENGTH: 200,
} as const;