export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TASK_DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "CRITICAL"];

// Default points a task is worth, based on its difficulty.
// Later we will make these configurable by the Director.
export const DIFFICULTY_POINTS = {
  EASY: 5,
  MEDIUM: 10,
  HARD: 20,
  CRITICAL: 40,
};

export const MAX_TASK_POINTS = 500;