import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCI9o29oFCD8hI1a2PLmDoL65SRMYvyxkc",
  authDomain: "pichicho-7fd34.firebaseapp.com",
  projectId: "pichicho-7fd34",
  storageBucket: "pichicho-7fd34.firebasestorage.app",
  messagingSenderId: "59092679526",
  appId: "1:59092679526:web:2d3f181d09b074a7e4a6a7",
  measurementId: "G-GZ8Y02QLK6"
};

console.log("Firebase Config:", firebaseConfig);

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);