import { auth, db } from "../../../firebase/firebase";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const provider = new GoogleAuthProvider();
const PRIMARY_USERS_COLLECTION = "users";
const LEGACY_USERS_COLLECTION = "usuarios";

export const loginWithEmailFirebase = async (email, password) => {
  const response = await signInWithEmailAndPassword(auth, email, password);
  return response.user;
};

export const loginWithGoogleFirebase = async () => {
  const response = await signInWithPopup(auth, provider);
  return response.user;
};

export const linkPasswordToGoogleUser = async (user, email, password) => {
  const credential = EmailAuthProvider.credential(email, password);
  return linkWithCredential(user, credential);
};

const getDocumentData = async (collectionName, uid) => {
  const userRef = doc(db, collectionName, uid);
  const userSnapshot = await getDoc(userRef);
  return userSnapshot.exists() ? userSnapshot.data() : null;
};

export const getUserFromDB = async (uid) => {
  const user = await getDocumentData(PRIMARY_USERS_COLLECTION, uid);

  if (user) {
    return user;
  }

  return getDocumentData(LEGACY_USERS_COLLECTION, uid);
};

export const saveUserToDB = async (user) => {
  const userRef = doc(db, PRIMARY_USERS_COLLECTION, user.uid);
  await setDoc(userRef, user);
};

export const createFirebaseAuthRepository = () => ({
  loginWithEmail: loginWithEmailFirebase,
  loginWithGoogle: loginWithGoogleFirebase,
  linkPasswordToGoogleUser,
  getUserById: getUserFromDB,
  saveUser: saveUserToDB,
});
