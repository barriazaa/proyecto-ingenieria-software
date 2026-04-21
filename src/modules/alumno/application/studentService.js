import { getStudentHighlights } from "../infrastructure/mockStudentRepository";

export const loadStudentModuleSummary = () => ({
  title: "Modulo Alumno",
  description:
    "Este espacio concentra las vistas y reglas relacionadas con estudiantes dentro de una estructura hexagonal.",
  highlights: getStudentHighlights(),
});
