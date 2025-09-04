import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAxmojqxgsD4fR9pcBhMt2P6vDoAruJ740",
  authDomain: "pichichioapp.firebaseapp.com",
  projectId: "pichichioapp",
  storageBucket: "pichichioapp.firebasestorage.app",
  messagingSenderId: "438192714060",
  appId: "1:438192714060:web:b74bd6fa34006a6cc71fe9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
console.log('Usuario actual:', auth.currentUser); 
export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };