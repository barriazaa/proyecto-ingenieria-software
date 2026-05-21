const STUDENT_ROLE = "estudiante";

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const isStudentRole = (role) => normalizeText(role) === STUDENT_ROLE;

export const buildStudentName = (student) =>
  `${student?.nombres || ""} ${student?.apellidos || ""}`.trim() ||
  student?.nombre ||
  student?.displayName ||
  "Estudiante";

export const normalizeStudent = (student, uid) => ({
  ...student,
  uid: student?.uid || uid,
  id: student?.uid || student?.id || uid,
  nombre: buildStudentName(student),
  correo: student?.email || student?.correo || "",
  carnet: student?.carnet || "",
  cursosAsignados: normalizeCourseAssignments(student),
});

export const normalizeCourseAssignments = (student) => {
  const assignments =
    student?.cursosAsignados ||
    student?.courses ||
    student?.assignedCourses ||
    student?.courseIds ||
    [];

  if (!Array.isArray(assignments)) {
    return [];
  }

  return assignments
    .map((course) => (typeof course === "string" ? course : course?.id || course?.courseId))
    .filter(Boolean);
};

export const mapAssignedCourses = (courses, assignedCourseIds, student) => {
  const embeddedCourses =
    student?.cursosAsignados?.filter?.((course) => typeof course === "object") ||
    student?.assignedCourses?.filter?.((course) => typeof course === "object") ||
    [];

  const explicitCourses = courses.filter((course) => assignedCourseIds.includes(course.id));
  const courseMap = [...explicitCourses, ...embeddedCourses].reduce((accumulator, course) => {
    if (course?.id) {
      accumulator.set(course.id, course);
    }

    return accumulator;
  }, new Map());

  return Array.from(courseMap.values());
}; 
