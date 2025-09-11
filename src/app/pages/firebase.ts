import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAxmojqxgsD4fR9pcBhMt2P6vDoAruJ740",
  authDomain: "pichichioapp.firebaseapp.com",
  projectId: "pichichioapp",
  storageBucket: "pichichioapp.firebasestorage.app",
  messagingSenderId: "438192714060",
  appId: "1:438192714060:web:b74bd6fa34006a6cc71fe9"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);