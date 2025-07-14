// services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ✅ Replace these with your real config values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCzd-WM-ajzGlYBlSon0r5LMCwR0jPTACY",
  authDomain: "yanyu-c2c83.firebaseapp.com",
  projectId: "yanyu-c2c83",
  storageBucket: "yanyu-c2c83.appspot.com",  // ❗️make sure it ends in .com, not .app
  messagingSenderId: "255890557176",
  appId: "1:255890557176:web:a43095e5ea9cc946ca130d"
};

// ✅ Initialize Firebase once
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Add this
