import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "synagogue-poster-gen-2026",
  appId: "1:200223463672:web:3762301a7c76ec4442430d",
  storageBucket: "synagogue-poster-gen-2026.firebasestorage.app",
  apiKey: "AIzaSyBfsAcXSrQO6Ktfdp1D2qyJ-VywKXY3RaE",
  authDomain: "synagogue-poster-gen-2026.firebaseapp.com",
  messagingSenderId: "200223463672"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
