import { ROUTES } from "../../../shared/utils/routePaths";

export const createCatedraticoCards = (reporteria) => [
  {
    id: "estudiantes",
    title: "Estudiantes",
    description: "Consulta el listado de estudiantes registrados en Firebase.",
    accent: "#22c55e",
  },

  {
    id: "cursos",
    title: "Cursos",
    description: "Gestiona los cursos desde su modulo independiente y conectado a Firestore.",
    actionLabel: "Ir a cursos",
    route: ROUTES.courses,
    accent: "#0ea5e9",
  },

  {
    id: "reporteria",
    title: "Reporteria",
    description: "Visualiza un resumen general de la actividad academica.",
    accent: "#f97316",
  },
];

export const mapStudentsForView = (students) =>
  students.map((student) => ({
    id: student.uid || student.id,
    nombre: `${student.nombres || ""} ${student.apellidos || ""}`.trim() || student.nombre || "Sin nombre",
    correo: student.email || student.correo || "Sin correo",
    carnet: student.carnet || "Sin carnet",
    estado: student.estado || "Activo",
  }));
