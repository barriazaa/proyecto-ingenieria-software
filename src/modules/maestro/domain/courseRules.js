export const createInitialCourseForm = () => ({
  id: null,
  codigo: "",
  nombre: "",
  seccion: "",
  docente: "",
  horario: "",
  aula: "",
  estado: true,
});

export const validateCourseForm = (form) => {
  if (
    !form.codigo.trim() ||
    !form.nombre.trim() ||
    !form.seccion.trim() ||
    !form.docente.trim() ||
    !form.horario.trim() ||
    !form.aula.trim()
  ) {
    throw new Error("Completa todos los campos del curso.");
  }
};

export const getCourseStatusLabel = (estado) => (estado ? "Activo" : "Inactivo");
