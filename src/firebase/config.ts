import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBuNEhHvJTrVnifLJcY11hjReSAFKf716I",
  authDomain: "encurtador-link-senai.firebaseapp.com",
  projectId: "encurtador-link-senai",
  storageBucket: "encurtador-link-senai.firebasestorage.app",
  messagingSenderId: "27130387650",
  appId: "1:27130387650:web:4a1f66b047904f42fd2f5b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
