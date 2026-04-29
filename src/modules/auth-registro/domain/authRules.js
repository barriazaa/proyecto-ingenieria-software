export const AUTH_ROLES = {
  student: "Estudiante",
  teacher: "Catedratico",
};

export const AUTH_ROLE_OPTIONS = [
  { label: "Alumno", value: AUTH_ROLES.student },
  { label: "Maestro", value: AUTH_ROLES.teacher },
];

export const createRegisteredUser = ({ firebaseUser, rol, form }) => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  carnet: form.carnet.trim(),
  nombres: form.nombres.trim(),
  apellidos: form.apellidos.trim(),
  rol,
  creadoEn: new Date(),
});
