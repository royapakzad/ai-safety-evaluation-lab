// types/scenario.ts

/**
 * Represents a single scenario loaded from a CSV file.
 * The 'id' corresponds to its 1-based index in the file for user display.
 */
export interface CsvScenario {
  id: number;
  context: string;
  prompt: string;
}
