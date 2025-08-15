// firebase.config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase project configuration
// You can find this in your Firebase Console -> Project Settings -> General -> Your apps
// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKoZEN98-mn5gbi5PiF7s-CgDiYsc-OAQ",
  authDomain: "multilingual-ai-evaluation.firebaseapp.com",
  projectId: "multilingual-ai-evaluation",
  storageBucket: "multilingual-ai-evaluation.firebasestorage.app",
  messagingSenderId: "1026821613424",
  appId: "1:1026821613424:web:e5bd1c2500d38ec27a51b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;