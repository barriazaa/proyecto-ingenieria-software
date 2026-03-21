export const createUserModel = (user) => {
  return {
    uid: user.uid,
    email: user.email,
    nombre: user.displayName || "",
    rol: "estudiante",
  };
};