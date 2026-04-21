import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAdTqDa6-wgNoOTQer823Fmi9fKuc0v1Y",
  authDomain: "asistencia-qr-6d2cb.firebaseapp.com",
  projectId: "asistencia-qr-6d2cb",
  storageBucket: "asistencia-qr-6d2cb.appspot.com",
  messagingSenderId: "689400209213",
  appId: "1:689400209213:web:7c9995f33c962149f62f54",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
