// services/authService.ts
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { User } from '../types';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

// Create or get user profile from Firestore
const getUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  
  if (userDoc.exists()) {
    return userDoc.data() as User;
  } else {
    // Create new user profile
    const newUser: User = {
      email: firebaseUser.email || '',
      role: firebaseUser.email === 'rpakzad@taraazresearch.org' ? 'admin' : 'evaluator'
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    return newUser;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = await getUserProfile(userCredential.user);
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const signUp = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = await getUserProfile(userCredential.user);
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create account');
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const onAuthStateChange = (callback: (authState: AuthState) => void): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const user = await getUserProfile(firebaseUser);
        callback({ user, loading: false });
      } catch (error) {
        console.error('Error getting user profile:', error);
        callback({ user: null, loading: false });
      }
    } else {
      callback({ user: null, loading: false });
    }
  });
};