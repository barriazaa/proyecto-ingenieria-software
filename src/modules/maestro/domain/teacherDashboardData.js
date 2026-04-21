import { ROUTES } from "../../../shared/utils/routePaths";

export const teacherCards = [
  {
    icon: "Est",
    title: "Estudiantes",
    description: "Visualiza el listado de estudiantes y administra su informacion.",
    button: "Ver estudiantes",
    route: ROUTES.students,
  },
  {
    icon: "Cur",
    title: "Cursos",
    description: "Consulta, agrega y modifica los cursos asignados al catedratico.",
    button: "Gestionar cursos",
    route: ROUTES.courses,
  },
  {
    icon: "Rep",
    title: "Reporteria",
    description: "Consulta informes, metricas y resumen general del sistema academico.",
    button: "Ver reporteria",
    route: ROUTES.reports,
  },
];

export const teacherFunctions = [
  "Consultar reporteria academica",
  "Ver listado de estudiantes",
  "Actualizar informacion de estudiantes",
  "Consultar cursos asignados",
  "Agregar nuevos cursos",
  "Modificar cursos existentes",
];

export const teacherStats = [
  { value: "3", label: "Modulos activos" },
  { value: "6", label: "Funciones disponibles" },
  { value: "100%", label: "Panel operativo" },
];
