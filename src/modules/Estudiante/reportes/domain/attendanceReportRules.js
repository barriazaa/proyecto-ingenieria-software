const DAY_NAME_BY_INDEX = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

// --- TU LÓGICA DE NORMALIZACIÓN (Mantenida al 100%) ---
const normalizeText = (value = "") =>
  String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDefaultDateRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
};

// --- TU PARSEADOR ROBUSTO (Indispensable para Firebase) ---
const parseDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;

  const stringValue = String(value);
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(stringValue)
    ? new Date(`${stringValue}T00:00:00`)
    : new Date(stringValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const normalizeDateKey = (value) => {
  const date = parseDate(value);
  return date ? toDateInputValue(date) : "";
};

const getCourseDaySet = (course) =>
  new Set((course?.dias || []).map((day) => normalizeText(day)));

// --- NUEVA FUNCIÓN: Formato Profesional [Código] - Nombre ---
export const getCourseDisplayName = (course) => {
  if (!course) return "Curso desconocido";
  const code = course.codigo || "S/C";
  return `[${code}] - ${course.nombre}`;
};

// --- TU FILTRO DE ASISTENCIAS (Actualizado para el array agrupado) ---
export const filterAttendancesByCourseAndRange = (attendances, courseId, range) => {
  const start = parseDate(range.startDate);
  const end = parseDate(range.endDate);

  return attendances.filter((attendance) => {
    // Soporte para objetos planos o marcas dentro del array agrupado
    const attendanceCourseId =
      attendance.courseId || attendance.cursoId || attendance.idCurso || courseId;

    if (String(attendanceCourseId) !== String(courseId)) return false;

    const attendanceDate = parseDate(attendance.fecha || attendance);

    if (!attendanceDate) return false;
    if (start && attendanceDate < start) return false;

    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      if (attendanceDate > endOfDay) return false;
    }

    return true;
  });
};

// --- TU CONTADOR DE CLASES (Con límite de seguridad "Hoy") ---
export const countCourseClassesInRange = (course, range) => {
  const start = parseDate(range.startDate);
  const end = parseDate(range.endDate);
  const courseDays = getCourseDaySet(course);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (!start || !end || start > end || courseDays.size === 0) return 0;

  let totalClasses = 0;
  const cursor = new Date(start);

  // Solo contamos clases que ya pasaron o son hoy
  while (cursor <= end && cursor <= today) {
    const dayName = DAY_NAME_BY_INDEX[cursor.getDay()];
    if (courseDays.has(normalizeText(dayName))) {
      totalClasses += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return totalClasses;
};

// --- TU RESUMEN FINAL (Potenciado) ---
export const calculateAttendanceSummary = (course, attendances, range) => {
  const totalClasses = countCourseClassesInRange(course, range);
  
  // Procesamos la lista de marcas (vengan del array agrupado o de docs sueltos)
  const filteredAttendances = filterAttendancesByCourseAndRange(attendances, course.id, range);
  
  const uniqueAttendanceDates = new Set(
    filteredAttendances
      .map((attendance) => normalizeDateKey(attendance.fecha || attendance))
      .filter(Boolean)
  );

  const attendedClasses = Math.min(uniqueAttendanceDates.size, totalClasses);
  const missedClasses = Math.max(totalClasses - attendedClasses, 0);
  const attendancePercentage =
    totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100);

  return {
    totalClasses,
    attendedClasses,
    missedClasses,
    attendancePercentage,
    filteredAttendances,
    // Inyectamos el nombre que usaremos en el H2 del detalle
    courseDisplayName: getCourseDisplayName(course) 
  };
};