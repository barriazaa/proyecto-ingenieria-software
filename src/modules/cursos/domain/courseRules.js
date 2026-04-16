export const DAYS = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

export const HOURS_24 = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, "0")
);

export const MINUTES = Array.from({ length: 60 }, (_, index) =>
  index.toString().padStart(2, "0")
);

export const createEmptyCourse = () => ({
  id: null,
  codigo: "",
  nombre: "",
  seccion: "",
  docente: "",
  aula: "",
  dias: [],
  horaInicioHora: "",
  horaInicioMinuto: "00",
  horaFinHora: "",
  horaFinMinuto: "00",
  horaInicio: "",
  horaFin: "",
  totalHoras: 0,
  horario: "",
  estado: true,
});

const toMinutes = (time) => {
  if (!time || !time.includes(":")) {
    return null;
  }

  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const buildTime = (hour, minute) => {
  if (hour === "") {
    return "";
  }

  return `${hour}:${minute || "00"}`;
};

export const buildCourseSchedule = (course) => {
  const horaInicio = buildTime(course.horaInicioHora, course.horaInicioMinuto);
  const horaFin = buildTime(course.horaFinHora, course.horaFinMinuto);
  const inicioMinutos = toMinutes(horaInicio);
  const finMinutos = toMinutes(horaFin);
  const totalMinutos =
    inicioMinutos !== null && finMinutos !== null && finMinutos > inicioMinutos
      ? finMinutos - inicioMinutos
      : 0;

  return {
    ...course,
    horaInicio,
    horaFin,
    horario: horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : "",
    totalHoras: Number((totalMinutos / 60).toFixed(2)),
  };
};

export const normalizeCourse = (course) =>
  buildCourseSchedule({
    ...course,
    codigo: course.codigo.trim(),
    nombre: course.nombre.trim(),
    seccion: course.seccion.trim(),
    docente: course.docente.trim(),
    aula: course.aula.trim(),
  });

export const validateCourseData = (course, existingCourses) => {
  if (
    !course.codigo.trim() ||
    !course.nombre.trim() ||
    !course.seccion.trim() ||
    !course.docente.trim() ||
    !course.aula.trim()
  ) {
    throw new Error("Completa todos los campos del curso.");
  }

  if (!course.dias?.length) {
    throw new Error("Selecciona al menos un dia para el curso.");
  }

  if (!course.horaInicio || !course.horaFin) {
    throw new Error("Selecciona la hora de inicio y fin.");
  }

  const inicioMinutos = toMinutes(course.horaInicio);
  const finMinutos = toMinutes(course.horaFin);

  if (inicioMinutos === null || finMinutos === null || finMinutos <= inicioMinutos) {
    throw new Error("La hora de fin debe ser mayor que la hora de inicio.");
  }

  for (const existingCourse of existingCourses) {
    if (existingCourse.id === course.id) {
      continue;
    }

    const sharedDays = (existingCourse.dias || []).filter((day) =>
      course.dias.includes(day)
    );

    if (!sharedDays.length) {
      continue;
    }

    const existingStart = toMinutes(existingCourse.horaInicio);
    const existingEnd = toMinutes(existingCourse.horaFin);

    if (existingStart === null || existingEnd === null) {
      continue;
    }

    const overlaps = inicioMinutos < existingEnd && finMinutos > existingStart;

    if (!overlaps) {
      continue;
    }

    if (existingCourse.aula?.trim().toLowerCase() === course.aula.trim().toLowerCase()) {
      throw new Error(
        `Conflicto de aula: ${course.aula} ya esta ocupada por ${existingCourse.nombre} en ${sharedDays.join(", ")} (${existingCourse.horario}).`
      );
    }

    if (
      existingCourse.docente?.trim().toLowerCase() ===
      course.docente.trim().toLowerCase()
    ) {
      throw new Error(
        `Conflicto de horario: ${course.docente} ya tiene asignado ${existingCourse.nombre} en ${sharedDays.join(", ")} (${existingCourse.horario}).`
      );
    }
  }
};

export const getCourseValidationMessage = (course, existingCourses) => {
  try {
    validateCourseData(course, existingCourses);
    return "";
  } catch (error) {
    return error.message || "El curso contiene datos invalidos.";
  }
};

export const matchesCourseSearch = (course, searchTerm) => {
  const text =
    `${course.codigo} ${course.nombre} ${course.seccion} ${course.docente} ${course.aula} ${(course.dias || []).join(" ")} ${course.horario}`.toLowerCase();
  return text.includes(searchTerm.toLowerCase());
};

export const getCourseStatusLabel = (estado) => (estado ? "Activo" : "Inactivo");
