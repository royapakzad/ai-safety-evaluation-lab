// services/evaluationService.ts

/**
 * @deprecated This service is deprecated and has been replaced by databaseService.ts.
 * The logic has been moved and refactored to support a mock backend architecture.
 * This file is kept to avoid breaking changes in projects that might have imported it,
 * but it should not be used for new development.
 */
console.warn("evaluationService.ts is deprecated. Please use databaseService.ts instead.");

// The original functions have been removed and their logic is now in databaseService.ts
// and the components that use it.

/**
 * Generate a unique ID for evaluations
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
