const MIN_PASSWORD_LENGTH = 6;

const ensureValue = (value) => (value || "").trim();

export const validateLoginInput = ({ email, password }) => {
  if (!ensureValue(email) || !password) {
    throw new Error("Completa todos los campos");
  }
};

export const validateRegistrationInput = ({ firebaseUser, rol, form }) => {
  if (!firebaseUser) {
    throw new Error("Usuario invalido");
  }

  if (!rol) {
    throw new Error("Selecciona un rol");
  }

  if (!ensureValue(form.carnet) || !ensureValue(form.nombres) || !ensureValue(form.apellidos)) {
    throw new Error("Completa todos los campos");
  }

  if (!form.password) {
    throw new Error("Ingresa una contrasena");
  }

  if (form.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("La contrasena debe tener al menos 6 caracteres");
  }

  if (form.password !== form.confirmPassword) {
    throw new Error("Las contrasenas no coinciden");
  }
};

export const ensureUserIsNotRegistered = (user) => {
  if (user) {
    throw new Error("El usuario ya esta registrado");
  }
};

export const ensureUserExists = (user) => {
  if (!user) {
    throw new Error("Usuario no registrado");
  }
};
