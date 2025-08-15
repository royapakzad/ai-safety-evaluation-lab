// services/databaseService.ts
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { EvaluationRecord, User } from '../types';

/**
 * Fetches evaluations from Firestore.
 * Filters evaluations based on the user's role.
 * @param user The current user. Admins get all evaluations, evaluators get their own.
 * @returns A promise that resolves to an array of EvaluationRecords.
 */
export const getEvaluations = async (user: User): Promise<EvaluationRecord[]> => {
  try {
    const evaluationsRef = collection(db, 'evaluations');
    let q;
    
    if (user.role === 'admin') {
      q = query(evaluationsRef, orderBy('timestamp', 'desc'));
    } else {
      q = query(
        evaluationsRef, 
        where('userEmail', '==', user.email),
        orderBy('timestamp', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const evaluations: EvaluationRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      evaluations.push({ ...doc.data(), id: doc.id } as EvaluationRecord);
    });
    
    return evaluations;
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    throw new Error('Failed to fetch evaluations');
  }
};

/**
 * Saves a new evaluation to Firestore.
 * @param evaluation The new evaluation record to add.
 * @returns A promise that resolves to the saved evaluation record.
 */
// Helper function to remove undefined values from objects
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedValues(value);
    }
  }
  return cleaned;
};

export const addEvaluation = async (evaluation: EvaluationRecord): Promise<EvaluationRecord> => {
  try {
    console.log('🔥 Original evaluation data:', evaluation);
    
    const evaluationsRef = collection(db, 'evaluations');
    const { id, ...evaluationData } = evaluation;
    
    // Remove undefined values to prevent Firestore errors
    const cleanedData = removeUndefinedValues(evaluationData);
    console.log('🔥 Cleaned data (no undefined values):', cleanedData);
    
    const docRef = await addDoc(evaluationsRef, cleanedData);
    const savedEvaluation = { ...evaluation, id: docRef.id };
    
    console.log(`✅ Evaluation ${docRef.id} added to Firestore successfully.`);
    return savedEvaluation;
  } catch (error) {
    console.error('❌ Error adding evaluation:', error);
    throw new Error(`Failed to save evaluation: ${(error as any).message || error}`);
  }
};


/**
 * Updates an existing evaluation in Firestore.
 * @param updatedEvaluation The evaluation record with updates.
 * @returns A promise that resolves to the updated evaluation record.
 */
export const updateEvaluation = async (updatedEvaluation: EvaluationRecord): Promise<EvaluationRecord> => {
  try {
    const { id, ...evaluationData } = updatedEvaluation;
    const docRef = doc(db, 'evaluations', id);
    
    await updateDoc(docRef, evaluationData);
    
    console.log(`Evaluation ${id} updated in Firestore.`);
    return updatedEvaluation;
  } catch (error) {
    console.error('Error updating evaluation:', error);
    throw new Error('Failed to update evaluation');
  }
};

/**
 * Deletes an evaluation from Firestore.
 * @param evaluationId The ID of the evaluation to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export const deleteEvaluation = async (evaluationId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'evaluations', evaluationId);
    await deleteDoc(docRef);
    
    console.log(`Evaluation ${evaluationId} deleted from Firestore.`);
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    throw new Error('Failed to delete evaluation');
  }
};
