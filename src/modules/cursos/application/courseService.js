import coursesRepository from "../infrastructure/FirebaseCoursesRepository";
import {
  buildCourseSchedule,
  createEmptyCourse,
  matchesCourseSearch,
  normalizeCourse,
  validateCourseData,
} from "../domain/courseRules";

export const getInitialCourseForm = () => createEmptyCourse();

export const getCourses = async () => {
  return coursesRepository.getCourses();
};

export const createCourse = async (course, existingCourses) => {
  const normalizedCourse = normalizeCourse(course);
  validateCourseData(normalizedCourse, existingCourses);
  return coursesRepository.createCourse(normalizedCourse);
};

export const updateCourse = async (course, existingCourses) => {
  const normalizedCourse = normalizeCourse(course);
  validateCourseData(normalizedCourse, existingCourses);
  return coursesRepository.updateCourse(normalizedCourse);
};

export const updateCourseDirect = async (course) => {
  return coursesRepository.updateCourse(course);
};

export const deleteCourse = async (course) => {
  return coursesRepository.deleteCourse(course);
};

export const filterCourses = (courses, search) => {
  return courses.filter((course) => matchesCourseSearch(course, search));
};

export const toggleCourseStatus = async (course) => {
  const updatedCourse = buildCourseSchedule({
    ...course,
    estado: !course.estado,
  });
  return coursesRepository.updateCourse(updatedCourse);
};

// Nueva función integrada para el manejo del token dinámico y hora de creación
export const updateCourseToken = async (course, token, timestamp) => {
  return coursesRepository.updateCourseToken(course.id, course._collection, token, timestamp);
};

// NUEVA FUNCIÓN: Cambia el requerimiento de GPS para un curso (Geofencing)
export const toggleGpsRequirement = async (course) => {
  const nuevoEstadoGps = !course.requiereGPS;
  return coursesRepository.updateGpsRequirement(
    course.id, 
    course._collection, 
    nuevoEstadoGps
  );
}; 