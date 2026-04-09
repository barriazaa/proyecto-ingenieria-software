import {
  loginWithEmailFirebase,
  loginWithGoogleFirebase,
  getUserFromDB,
  saveUserToDB,
} from "../infrastructure/FirebaseAuthRepository";

// Login con correo
export const loginWithEmail = async (email, password) => {
  const firebaseUser = await loginWithEmailFirebase(email, password);

  const userDB = await getUserFromDB(firebaseUser.uid);

  if (!userDB) {
    throw new Error("Usuario no registrado");
  }

  return userDB;
};

// Login con Google lud
export const loginWithGoogle = async () => {
  const firebaseUser = await loginWithGoogleFirebase();

  const userDB = await getUserFromDB(firebaseUser.uid);

  if (!userDB) {
    return {
      needsRegistration: true,
      firebaseUser,
    };
  }

  return {
    needsRegistration: false,
    user: userDB,
  };
};

// Registro
export const registerUser = async (firebaseUser, rol) => {
  if (!firebaseUser) {
    throw new Error("Usuario inválido");
  }

  if (!rol) {
    throw new Error("Debe seleccionar un rol");
  }

  const existingUser = await getUserFromDB(firebaseUser.uid);

  if (existingUser) {
    throw new Error("El usuario ya está registrado");
  }

  const newUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    nombre: firebaseUser.displayName || "",
    rol,
    creadoEn: new Date(),
  };

  await saveUserToDB(newUser);

  return newUser;
}; 