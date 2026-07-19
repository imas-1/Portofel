import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyChe2wBDmgWsf0uAeZl8MZHDvKVzUb_i8Y",
  authDomain: "portofel-9c44b.firebaseapp.com",
  projectId: "portofel-9c44b",
  storageBucket: "portofel-9c44b.firebasestorage.app",
  messagingSenderId: "934723282384",
  appId: "1:934723282384:web:0b2b047b243628d43bc5d5",
  measurementId: "G-GNQ4L80B7M",
  databaseURL: "https://portofel-9c44b-default-rtdb.europe-west1.firebasedatabase.app"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
