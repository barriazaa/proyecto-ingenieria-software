import { auth, db } from "../../../firebase/config";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const provider = new GoogleAuthProvider();

// Email login
export const loginWithEmailFirebase = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// Google login
export const loginWithGoogleFirebase = async () => {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);

  return result.user;
};

// Firestore
export const getUserFromDB = async (uid) => {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const saveUserToDB = async (user) => {
  const ref = doc(db, "usuarios", user.uid);
  await setDoc(ref, user);
};