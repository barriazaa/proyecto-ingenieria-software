const DAY_NAME_BY_INDEX = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateKey = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value?.toDate === "function") {
    return toDateKey(value.toDate());
  }

  if (value instanceof Date) {
    return toDateKey(value);
  }

  const stringValue = String(value);
  const dateKeyMatch = stringValue.match(/^\d{4}-\d{2}-\d{2}/);

  if (dateKeyMatch) {
    return dateKeyMatch[0];
  }

  const parsedDate = new Date(stringValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return toDateKey(parsedDate);
  }

  return stringValue.slice(0, 10);
};

const parseDateKey = (dateKey) => {
  const normalizedDateKey = normalizeDateKey(dateKey);
  const parts = normalizedDateKey.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const normalizeDateRange = (range) => {
  const fechaInicio = normalizeDateKey(range?.fechaInicio || range?.startDate);
  const fechaFin = normalizeDateKey(range?.fechaFin || range?.endDate);

  if (!fechaInicio || !fechaFin) {
    return null;
  }

  return fechaInicio <= fechaFin
    ? { fechaInicio, fechaFin }
    : { fechaInicio: fechaFin, fechaFin: fechaInicio };
};

const isDateKeyInRange = (dateKey, range) =>
  !range || (dateKey >= range.fechaInicio && dateKey <= range.fechaFin);

const filterAttendanceDatesByRange = (dates, range) =>
  dates.filter((date) => {
    const dateKey = normalizeDateKey(date);
    return dateKey && isDateKeyInRange(dateKey, range);
  });

export const getCourseClassDatesInRange = (diasCurso, fechaInicio, fechaFin) => {
  const range = normalizeDateRange({ fechaInicio, fechaFin });
  const courseDays = new Set((diasCurso || []).map((day) => normalizeText(day)));
  const startDate = parseDateKey(range?.fechaInicio);
  const endDate = parseDateKey(range?.fechaFin);

  if (!range || !startDate || !endDate || courseDays.size === 0) {
    return [];
  }

  const classDates = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const dayName = DAY_NAME_BY_INDEX[cursor.getDay()];

    if (courseDays.has(normalizeText(dayName))) {
      classDates.push(toDateKey(cursor));
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return classDates;
};

const getStudentKey = (detail) =>
  detail.estudianteUid || detail.estudianteCarnet || detail.estudianteNombre || detail.id;

const buildStudentKeys = (student) => {
  const keys = [
    student?.estudianteUid && `uid:${student.estudianteUid}`,
    student?.uid && `uid:${student.uid}`,
    student?.id && `uid:${student.id}`,
    student?.estudianteCarnet && `carnet:${student.estudianteCarnet}`,
    student?.carnet && `carnet:${student.carnet}`,
  ];

  return keys.filter(Boolean).map((key) => String(key).trim().toLowerCase());
};

const findExistingStudentKey = (studentsById, student) => {
  const studentKeys = buildStudentKeys(student);
  return studentKeys.find((key) => studentsById.has(key)) || "";
};

const setStudentByAllKeys = (studentsById, student) => {
  const studentKeys = buildStudentKeys(student);
  const fallbackKey = getStudentKey(student);
  const canonicalKey = studentKeys[0] || (fallbackKey ? `fallback:${fallbackKey}` : "");

  if (!canonicalKey) {
    return;
  }

  const nextStudent = {
    ...student,
    _studentReportKey: canonicalKey,
  };

  if (studentKeys.length === 0) {
    studentsById.set(canonicalKey, nextStudent);
    return;
  }

  studentKeys.forEach((studentKey) => {
    studentsById.set(studentKey, nextStudent);
  });
};

const getUniqueStudents = (studentsById) => {
  const uniqueStudents = new Map();

  studentsById.forEach((student) => {
    uniqueStudents.set(student._studentReportKey || getStudentKey(student), student);
  });

  return Array.from(uniqueStudents.values());
};

const getAttendanceDates = (detail) =>
  Array.isArray(detail.fechasAsistencia) ? detail.fechasAsistencia : [];

const buildAssignedStudentName = (student) =>
  student?.estudianteNombre ||
  student?.nombre ||
  `${student?.nombres || ""} ${student?.apellidos || ""}`.trim() ||
  "Estudiante sin nombre";

const normalizeAssignedStudent = (student, course = {}) => ({
  ...student,
  id: student?.id || student?.uid || student?.estudianteUid || "",
  cursoId: course?.id || student?.cursoId || "",
  cursoNombre: course?.nombre || student?.cursoNombre || "Curso sin nombre",
  estudianteUid: student?.estudianteUid || student?.uid || student?.id || "",
  estudianteNombre: buildAssignedStudentName(student),
  estudianteCarnet: student?.estudianteCarnet || student?.carnet || "Sin carnet",
  seccion: course?.seccion || student?.seccion || "",
  fechasAsistencia: [],
  estado: "Activo",
  isCurrentlyAssigned: true,
  totalAsistencias: 0,
});

export const normalizeAttendanceDetail = (detail) => ({
  ...detail,
  cursoId: detail.cursoId || "",
  cursoNombre: detail.cursoNombre || "Curso sin nombre",
  estudianteUid: detail.estudianteUid || "",
  estudianteNombre: detail.estudianteNombre || "Estudiante sin nombre",
  estudianteCarnet: detail.estudianteCarnet || "Sin carnet",
  seccion: detail.seccion || "",
  fechasAsistencia: getAttendanceDates(detail),
  estado: detail.estado || detail.estudianteEstado || detail.estadoEstudiante || "Activo",
  isCurrentlyAssigned: false,
});

const mergeStudentAttendance = (details, range, assignedStudents = [], course = {}) => {
  const studentsById = new Map();

  assignedStudents.forEach((student) => {
    const normalizedStudent = normalizeAssignedStudent(student, course);

    setStudentByAllKeys(studentsById, normalizedStudent);
  });

  details.forEach((detail) => {
    const normalizedDetail = normalizeAttendanceDetail(detail);
    const existingStudentKey = findExistingStudentKey(studentsById, normalizedDetail);
    const previousRecord = existingStudentKey ? studentsById.get(existingStudentKey) : null;
    const fechasAsistencia = range
      ? filterAttendanceDatesByRange(normalizedDetail.fechasAsistencia, range)
      : normalizedDetail.fechasAsistencia;
    const asistenciaCount = fechasAsistencia.length;

    if (!previousRecord) {
      setStudentByAllKeys(studentsById, {
        ...normalizedDetail,
        fechasAsistencia,
        totalAsistencias: asistenciaCount,
        estado: "Inactivo",
        isCurrentlyAssigned: false,
      });
      return;
    }

    setStudentByAllKeys(studentsById, {
      ...previousRecord,
      cursoId: previousRecord.cursoId || normalizedDetail.cursoId,
      cursoNombre: previousRecord.cursoNombre || normalizedDetail.cursoNombre,
      seccion: previousRecord.seccion || normalizedDetail.seccion,
      estudianteUid: previousRecord.estudianteUid || normalizedDetail.estudianteUid,
      estudianteNombre: previousRecord.estudianteNombre || normalizedDetail.estudianteNombre,
      estudianteCarnet: previousRecord.estudianteCarnet || normalizedDetail.estudianteCarnet,
      fechasAsistencia: [...previousRecord.fechasAsistencia, ...fechasAsistencia],
      totalAsistencias: previousRecord.totalAsistencias + asistenciaCount,
      estado: previousRecord.isCurrentlyAssigned ? "Activo" : "Inactivo",
      isCurrentlyAssigned: Boolean(previousRecord.isCurrentlyAssigned),
    });
  });

  return getUniqueStudents(studentsById);
};

const addStudentAttendanceCalculations = (students, clasesEsperadas) =>
  students.map((student) => {
    const totalAsistencias = student.totalAsistencias || 0;
    const totalInasistencias = Math.max(clasesEsperadas - totalAsistencias, 0);
    const porcentajeAsistencia =
      clasesEsperadas === 0 ? 0 : Math.round((totalAsistencias / clasesEsperadas) * 100);
    const porcentajeInasistencia =
      clasesEsperadas === 0
        ? 0
        : Math.round((totalInasistencias / clasesEsperadas) * 100);

    return {
      ...student,
      totalAsistencias,
      totalInasistencias,
      porcentaje: porcentajeAsistencia,
      porcentajeAsistencia,
      porcentajeInasistencia,
      estado: student.isCurrentlyAssigned ? "Activo" : "Inactivo",
    };
  });

const calculateSummaryTotals = (students) => {
  const totalEstudiantes = students.length;
  const totalAsistencias = students.reduce(
    (total, student) => total + student.totalAsistencias,
    0
  );
  const totalInasistencias = students.reduce(
    (total, student) => total + student.totalInasistencias,
    0
  );
  const porcentaje =
    totalEstudiantes === 0
      ? 0
      : Math.round(
          students.reduce((total, student) => total + student.porcentajeAsistencia, 0) /
            totalEstudiantes
        );

  return {
    totalEstudiantes,
    totalAsistencias,
    totalInasistencias,
    porcentaje,
  };
};

export const summarizeCourseAttendance = (
  details,
  course = {},
  dateRange,
  assignedStudents = []
) => {
  const courseDetails = details
    .filter((detail) => !course?.id || String(detail.cursoId) === String(course.id))
    .map(normalizeAttendanceDetail);
  const normalizedRange = normalizeDateRange(dateRange);
  const students = mergeStudentAttendance(
    courseDetails,
    normalizedRange,
    assignedStudents,
    course
  );
  const attendanceDates = new Set();

  if (normalizedRange) {
    const classDates = getCourseClassDatesInRange(
      course?.dias || [],
      normalizedRange.fechaInicio,
      normalizedRange.fechaFin
    );
    const clasesEsperadas = classDates.length;
    const studentsWithCalculations = addStudentAttendanceCalculations(
      students,
      clasesEsperadas
    );
    const summaryTotals = calculateSummaryTotals(studentsWithCalculations);

    return {
      cursoId: course?.id || courseDetails[0]?.cursoId || "",
      cursoNombre: course?.nombre || courseDetails[0]?.cursoNombre || "Curso sin nombre",
      seccion: course?.seccion || courseDetails[0]?.seccion || "",
      ...summaryTotals,
      clasesEsperadas,
      rangoAplicado: normalizedRange,
      students: studentsWithCalculations,
    };
  }

  const maxAttendancesByStudent = students.reduce(
    (maxValue, student) => Math.max(maxValue, student.totalAsistencias),
    0
  );

  courseDetails.forEach((detail) => {
    detail.fechasAsistencia.forEach((date) => {
      const dateKey = normalizeDateKey(date);

      if (dateKey) {
        attendanceDates.add(dateKey);
      }
    });
  });

  const clasesEsperadas = Math.max(attendanceDates.size, maxAttendancesByStudent);
  const studentsWithCalculations = addStudentAttendanceCalculations(
    students,
    clasesEsperadas
  );
  const summaryTotals = calculateSummaryTotals(studentsWithCalculations);

  return {
    cursoId: course?.id || courseDetails[0]?.cursoId || "",
    cursoNombre: course?.nombre || courseDetails[0]?.cursoNombre || "Curso sin nombre",
    seccion: course?.seccion || courseDetails[0]?.seccion || "",
    ...summaryTotals,
    clasesEsperadas,
    students: studentsWithCalculations,
  };
};

export const summarizeTeacherAttendanceDashboard = (details) => {
  const normalizedDetails = details.map(normalizeAttendanceDetail);
  const coursesById = new Map();
  const studentIds = new Set();

  normalizedDetails.forEach((detail) => {
    if (detail.cursoId) {
      const currentCourseDetails = coursesById.get(detail.cursoId) || [];
      coursesById.set(detail.cursoId, [...currentCourseDetails, detail]);
    }

    const studentKey = getStudentKey(detail);

    if (studentKey) {
      studentIds.add(studentKey);
    }
  });

  const courses = Array.from(coursesById.entries()).map(([cursoId, courseDetails]) =>
    summarizeCourseAttendance(courseDetails, {
      id: cursoId,
      nombre: courseDetails[0]?.cursoNombre,
      seccion: courseDetails[0]?.seccion,
    })
  );
  const totalAsistencias = courses.reduce((total, course) => total + course.totalAsistencias, 0);
  const totalInasistencias = courses.reduce(
    (total, course) => total + course.totalInasistencias,
    0
  );

  return {
    totalCursosUnicos: courses.length,
    totalEstudiantesUnicos: studentIds.size,
    totalAsistencias,
    totalInasistencias,
    courses,
  };
}; 
