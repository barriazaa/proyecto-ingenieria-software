import { createRegisteredUser } from "../domain/authRules";
import { createFirebaseAuthRepository } from "../infrastructure/FirebaseAuthRepository";
import { createAuthRepositoryPort } from "./AuthRepositoryPort";
import {
  ensureUserExists,
  ensureUserIsNotRegistered,
  validateLoginInput,
  validateRegistrationInput,
} from "./AuthValidators";

const authRepository = createAuthRepositoryPort(createFirebaseAuthRepository());

export const loginWithEmail = async (email, password) => {
  validateLoginInput({ email, password });

  const firebaseUser = await authRepository.loginWithEmail(email, password);
  const user = await authRepository.getUserById(firebaseUser.uid);

  ensureUserExists(user);

  return user;
};

export const loginWithGoogle = async () => {
  const firebaseUser = await authRepository.loginWithGoogle();
  const user = await authRepository.getUserById(firebaseUser.uid);

  if (!user) {
    return { needsRegistration: true, firebaseUser };
  }

  return { needsRegistration: false, user };
};

export const startGoogleRegistration = async () => {
  const firebaseUser = await authRepository.loginWithGoogle();
  const existingUser = await authRepository.getUserById(firebaseUser.uid);

  ensureUserIsNotRegistered(existingUser);

  return firebaseUser;
};

export const registerCompleteUser = async (firebaseUser, rol, form) => {
  validateRegistrationInput({ firebaseUser, rol, form });

  const existingUser = await authRepository.getUserById(firebaseUser.uid);
  ensureUserIsNotRegistered(existingUser);

  try {
    await authRepository.linkPasswordToGoogleUser(
      firebaseUser,
      firebaseUser.email,
      form.password
    );
  } catch (error) {
    if (error.code === "auth/credential-already-in-use") {
      throw new Error("Este correo ya tiene contrasena registrada");
    }

    throw error;
  }

  const newUser = createRegisteredUser({ firebaseUser, rol, form });
  await authRepository.saveUser(newUser);

  return newUser;
};
