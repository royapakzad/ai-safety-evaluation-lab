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
import { db, auth } from '../firebase.config';
import { EvaluationRecord, User } from '../types';

/**
 * Fetches evaluations from Firestore.
 * Filters evaluations based on the user's role.
 * @param user The current user. Admins get all evaluations, evaluators get their own.
 * @returns A promise that resolves to an array of EvaluationRecords.
 */
export const getEvaluations = async (user: User): Promise<EvaluationRecord[]> => {
  try {
    console.log('🔥 === STARTING EVALUATION FETCH ===');
    console.log('🔥 Firebase app config:', db?.app?.options);
    console.log('🔥 Current auth user:', auth?.currentUser?.email);
    console.log('🔥 Fetching evaluations for user:', user);
    
    const evaluationsRef = collection(db, 'evaluations');
    console.log('🔥 Collection reference created:', evaluationsRef);
    
    let q;
    
    if (user.role === 'admin') {
      console.log('🔥 Admin user - fetching all evaluations');
      q = query(evaluationsRef, orderBy('timestamp', 'desc'));
    } else {
      console.log('🔥 Regular user - fetching evaluations for email:', user.email);
      q = query(
        evaluationsRef, 
        where('userEmail', '==', user.email),
        orderBy('timestamp', 'desc')
      );
    }
    
    console.log('🔥 Executing query...');
    const querySnapshot = await getDocs(q);
    console.log('🔥 Query completed, documents found:', querySnapshot.size);
    
    const evaluations: EvaluationRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log('🔥 Processing document:', doc.id, doc.data());
      evaluations.push({ ...doc.data(), id: doc.id } as EvaluationRecord);
    });
    
    console.log('🔥 Final evaluations array:', evaluations);
    console.log('🔥 === EVALUATION FETCH COMPLETE ===');
    return evaluations;
  } catch (error) {
    console.error('❌ === EVALUATION FETCH FAILED ===');
    console.error('❌ Detailed error fetching evaluations:', error);
    console.error('❌ Error name:', (error as any).name);
    console.error('❌ Error code:', (error as any).code);
    console.error('❌ Error message:', (error as any).message);
    console.error('❌ Auth state:', auth?.currentUser ? 'Authenticated' : 'Not authenticated');
    throw new Error(`Failed to fetch evaluations: ${(error as any).message || error}`);
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
    console.log('🔥 === STARTING EVALUATION SAVE ===');
    console.log('🔥 Firebase app config:', db?.app?.options);
    console.log('🔥 Current auth user:', auth?.currentUser?.email);
    console.log('🔥 Original evaluation data:', evaluation);
    console.log('🔥 Current user email in data:', evaluation.userEmail);
    
    // Test Firebase connection first
    console.log('🔥 Testing Firebase connection...');
    const testRef = collection(db, 'evaluations');
    console.log('🔥 Collection reference created successfully:', testRef.path);
    
    const { id, ...evaluationData } = evaluation;
    
    // Remove undefined values to prevent Firestore errors
    const cleanedData = removeUndefinedValues(evaluationData);
    console.log('🔥 Cleaned data (no undefined values):', cleanedData);
    console.log('🔥 About to call addDoc...');
    
    const docRef = await addDoc(testRef, cleanedData);
    console.log('🔥 addDoc completed successfully, document ID:', docRef.id);
    
    const savedEvaluation = { ...evaluation, id: docRef.id };
    
    console.log(`✅ Evaluation ${docRef.id} added to Firestore successfully.`);
    console.log('🔥 === EVALUATION SAVE COMPLETE ===');
    return savedEvaluation;
  } catch (error) {
    console.error('❌ === EVALUATION SAVE FAILED ===');
    console.error('❌ Error adding evaluation:', error);
    console.error('❌ Error name:', (error as any).name);
    console.error('❌ Error code:', (error as any).code);
    console.error('❌ Error message:', (error as any).message);
    console.error('❌ Full error object:', error);
    console.error('❌ Auth state:', auth?.currentUser ? 'Authenticated' : 'Not authenticated');
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
    
    // Remove undefined values to prevent Firestore errors
    const cleanedData = removeUndefinedValues(evaluationData);
    console.log('🔥 Updating evaluation with cleaned data:', cleanedData);
    
    await updateDoc(docRef, cleanedData);
    
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

/**
 * RAW DATABASE EXPORT - NO FILTERING, NO LOGIC, NO DECISIONS
 * Gets exactly what's in Firebase - nothing more, nothing less
 */
export const getAllEvaluationsForExport = async (user: User): Promise<any[]> => {
  try {
    console.log('🔥 RAW EXPORT: Starting completely unfiltered database dump');
    console.log('🔥 RAW EXPORT: User role:', user.role, 'Email:', user.email);
    
    const evaluationsRef = collection(db, 'evaluations');
    
    let querySnapshot;
    if (user.role === 'admin') {
      console.log('🔥 RAW EXPORT: Admin - getting EVERYTHING from database');
      // Admin gets EVERYTHING - no query conditions at all
      querySnapshot = await getDocs(evaluationsRef);
    } else {
      console.log('🔥 RAW EXPORT: User - getting their records only');
      // User gets only their records - minimal query
      const userQuery = query(evaluationsRef, where('userEmail', '==', user.email));
      querySnapshot = await getDocs(userQuery);
    }
    
    console.log('🔥 RAW EXPORT: Firebase returned', querySnapshot.size, 'total documents');
    
    const rawData: any[] = [];
    
    querySnapshot.forEach((doc) => {
      // Get raw document data with ID - no processing, no type casting, no filtering
      const rawDocument = { ...doc.data(), firebaseId: doc.id };
      console.log('🔥 RAW EXPORT: Adding document:', doc.id);
      rawData.push(rawDocument);
    });
    
    console.log('🔥 RAW EXPORT: Returning', rawData.length, 'raw documents - NO FILTERING APPLIED');
    return rawData;
    
  } catch (error) {
    console.error('❌ RAW EXPORT: Failed to get raw data:', error);
    throw error; // Don't wrap the error - let it bubble up raw
  }
};
