// services/databaseService.ts
import { EvaluationRecord, User, ReasoningEvaluationRecord } from '../types';
import { EVALUATIONS_KEY } from '../constants';

/**
 * --- DEVELOPER NOTE ---
 * This is a MOCK database service that uses localStorage to simulate a real backend.
 * For true cross-device data persistence, replace the implementation of these
 * functions with actual API calls to a central database (e.g., Firebase, Supabase, or a custom backend).
 * The function signatures are designed to be async to mimic network requests.
 */

const FAKE_NETWORK_DELAY = 300; // ms

const getAllEvaluationsFromStorage = (): EvaluationRecord[] => {
  try {
    const evaluationsJson = localStorage.getItem(EVALUATIONS_KEY);
    if (!evaluationsJson) return [];
    
    const evaluations = JSON.parse(evaluationsJson) as EvaluationRecord[];
    // Normalize old data structures if necessary
    return evaluations.map(ev => {
        // Ensure labType exists for older records
        const labType = ev.labType || ((ev as any).scores?.inconsistency ? 'multilingual' : 'reasoning');
        // Ensure userEmail exists
        const userEmail = ev.userEmail || (ev as any).user || 'unknown@example.com';
        return { ...ev, labType, userEmail };
    }) as EvaluationRecord[];
  } catch (error) {
    console.error("Error reading from mock database (localStorage):", error);
    return [];
  }
};

const saveAllEvaluationsToStorage = (evaluations: EvaluationRecord[]): void => {
  try {
    localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));
  } catch (error) {
    console.error("Error writing to mock database (localStorage):", error);
    // Optionally, alert the user if storage is full
    // alert("Failed to save data. Your browser's storage may be full.");
  }
};

/**
 * Fetches evaluations from the database.
 * Filters evaluations based on the user's role.
 * @param user The current user. Admins get all evaluations, evaluators get their own.
 * @returns A promise that resolves to an array of EvaluationRecords.
 */
export const getEvaluations = async (user: User): Promise<EvaluationRecord[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const allEvaluations = getAllEvaluationsFromStorage();
      if (user.role === 'admin') {
        resolve(allEvaluations);
      } else {
        const userEvaluations = allEvaluations.filter(ev => ev.userEmail === user.email);
        resolve(userEvaluations);
      }
    }, FAKE_NETWORK_DELAY);
  });
};

/**
 * Saves a new evaluation to the database.
 * @param evaluation The new evaluation record to add.
 * @returns A promise that resolves to the saved evaluation record.
 */
export const addEvaluation = async (evaluation: EvaluationRecord): Promise<EvaluationRecord> => {
   return new Promise(resolve => {
    setTimeout(() => {
      const allEvaluations = getAllEvaluationsFromStorage();
      const updatedEvaluations = [...allEvaluations, evaluation];
      saveAllEvaluationsToStorage(updatedEvaluations);
      console.log(`(Mock DB) Evaluation ${evaluation.id} added.`);
      resolve(evaluation);
    }, FAKE_NETWORK_DELAY);
  });
};


/**
 * Updates an existing evaluation in the database.
 * @param updatedEvaluation The evaluation record with updates.
 * @returns A promise that resolves to the updated evaluation record.
 */
export const updateEvaluation = async (updatedEvaluation: EvaluationRecord): Promise<EvaluationRecord> => {
   return new Promise((resolve, reject) => {
    setTimeout(() => {
      let allEvaluations = getAllEvaluationsFromStorage();
      const index = allEvaluations.findIndex(ev => ev.id === updatedEvaluation.id);
      if (index === -1) {
        console.error("Evaluation not found for update:", updatedEvaluation.id);
        return reject(new Error("Evaluation not found for update."));
      }
      allEvaluations[index] = updatedEvaluation;
      saveAllEvaluationsToStorage(allEvaluations);
      console.log(`(Mock DB) Evaluation ${updatedEvaluation.id} updated.`);
      resolve(updatedEvaluation);
    }, FAKE_NETWORK_DELAY);
  });
};

/**
 * Deletes an evaluation from the database.
 * @param evaluationId The ID of the evaluation to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export const deleteEvaluation = async (evaluationId: string): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const allEvaluations = getAllEvaluationsFromStorage();
      const updatedEvaluations = allEvaluations.filter(ev => ev.id !== evaluationId);
      saveAllEvaluationsToStorage(updatedEvaluations);
      console.log(`(Mock DB) Evaluation ${evaluationId} deleted.`);
      resolve();
    }, FAKE_NETWORK_DELAY);
  });
};
