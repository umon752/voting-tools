import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBLxwSZ2ghNZqTO-5j49eKPiCfb_FuMBa0",
  authDomain: "voting-tools-525a4.firebaseapp.com",
  projectId: "voting-tools-525a4",
  storageBucket: "voting-tools-525a4.firebasestorage.app",
  messagingSenderId: "936869783160",
  appId: "1:936869783160:web:77331bd3069312ea746f8d",
  databaseURL: "https://voting-tools-525a4-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
