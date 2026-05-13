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

const formatDateLabel = (dateKey) => {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
};

const getCourseDaySet = (course) =>
  new Set((course?.dias || []).map((day) => normalizeText(day)));

const getCourseStartDateKey = (course) => {
  const candidates = [
    course?.fechaInicio,
    course?.startDate,
    course?.createdAt,
    course?.created_at,
  ];

  return candidates.map(normalizeDateKey).find(Boolean) || "";
};

const normalizeRangeOrder = (range) => {
  const startDate = normalizeDateKey(range?.startDate);
  const endDate = normalizeDateKey(range?.endDate);

  if (startDate && endDate && startDate > endDate) {
    return { startDate: endDate, endDate: startDate };
  }

  return { startDate, endDate };
};

const getEffectiveClassRange = (course, attendanceDateKeys, range) => {
  const selectedRange = normalizeRangeOrder(range);

  if (selectedRange.startDate && selectedRange.endDate) {
    return selectedRange;
  }

  const sortedDateKeys = [...attendanceDateKeys].sort();
  const firstAttendanceDate = sortedDateKeys[0] || "";
  const lastAttendanceDate = sortedDateKeys[sortedDateKeys.length - 1] || "";
  const courseStartDate = getCourseStartDateKey(course);
  const today = toDateInputValue(new Date());

  if (selectedRange.startDate) {
    return {
      startDate: selectedRange.startDate,
      endDate: selectedRange.endDate || today,
    };
  }

  if (selectedRange.endDate) {
    return {
      startDate: courseStartDate || firstAttendanceDate || selectedRange.endDate,
      endDate: selectedRange.endDate,
    };
  }

  if (!courseStartDate && !firstAttendanceDate && !lastAttendanceDate) {
    return { startDate: "", endDate: "" };
  }

  return {
    startDate: courseStartDate || firstAttendanceDate || lastAttendanceDate,
    endDate: lastAttendanceDate || today,
  };
};

// --- NUEVA FUNCIÓN: Formato Profesional [Código] - Nombre ---
export const getCourseDisplayName = (course) => {
  if (!course) return "Curso desconocido";
  const code = course.codigo || "S/C";
  return `[${code}] - ${course.nombre}`;
};

// --- TU FILTRO DE ASISTENCIAS (Actualizado para el array agrupado) ---
export const filterAttendancesByCourseAndRange = (attendances, courseId, range) => {
  const selectedRange = normalizeRangeOrder(range);
  const start = parseDate(selectedRange.startDate);
  const end = parseDate(selectedRange.endDate);

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
  const selectedRange = normalizeRangeOrder(range);
  const start = parseDate(selectedRange.startDate);
  const end = parseDate(selectedRange.endDate);
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
  // Procesamos la lista de marcas (vengan del array agrupado o de docs sueltos)
  const filteredAttendances = filterAttendancesByCourseAndRange(attendances, course.id, range);
  
  const uniqueAttendanceDates = new Set(
    filteredAttendances
      .map((attendance) => normalizeDateKey(attendance.fecha || attendance))
      .filter(Boolean)
  );
  const effectiveRange = getEffectiveClassRange(course, uniqueAttendanceDates, range);
  const totalClasses = countCourseClassesInRange(course, effectiveRange);

  const attendedClasses = Math.min(uniqueAttendanceDates.size, totalClasses);
  const missedClasses = Math.max(totalClasses - attendedClasses, 0);
  const attendancePercentage =
    totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100);
  const absencePercentage = totalClasses === 0 ? 0 : 100 - attendancePercentage;
  const attendanceRows = Array.from(uniqueAttendanceDates)
    .sort()
    .reverse()
    .map((dateKey) => ({
      id: dateKey,
      fecha: dateKey,
      fechaLabel: formatDateLabel(dateKey),
      estado: "Registrada",
    }));

  return {
    totalClasses,
    attendedClasses,
    missedClasses,
    attendancePercentage,
    absencePercentage,
    attendanceRows,
    filteredAttendances,
    effectiveRange,
    // Inyectamos el nombre que usaremos en el H2 del detalle
    courseDisplayName: getCourseDisplayName(course) 
  };
};
