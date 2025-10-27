// Firebase Configuration for Carben Connect Mobile 2.0
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from CREDENTIALS.md
const firebaseConfig = {
  apiKey: 'AIzaSyC6AIuhJVcVLdktRxjgWIb70VSuRuqCaxU',
  authDomain: 'carben-connect.firebaseapp.com',
  projectId: 'carben-connect',
  storageBucket: 'carben-connect.firebasestorage.app',
  messagingSenderId: '25867782405',
  appId: '1:25867782405:web:11e29cf3c746b7c17f8f6c'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export the app instance for debugging
export default app;
