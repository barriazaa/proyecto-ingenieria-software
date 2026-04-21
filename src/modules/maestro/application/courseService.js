import { createInitialCourseForm, validateCourseForm } from "../domain/courseRules";
import { getMockCourses } from "../infrastructure/mockCoursesRepository";

export const getInitialCourseForm = () => createInitialCourseForm();

export const getInitialCourses = () => getMockCourses();

export const filterCourses = (courses, searchTerm) => {
  return courses.filter((course) => {
    const text =
      `${course.codigo} ${course.nombre} ${course.seccion} ${course.docente} ${course.horario} ${course.aula}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });
};

export const saveCourse = ({ courses, form, isEditing }) => {
  validateCourseForm(form);

  if (isEditing) {
    return courses.map((course) => (course.id === form.id ? form : course));
  }

  return [{ ...form, id: Date.now() }, ...courses];
};

export const toggleCourseStatus = (courses, id) =>
  courses.map((course) =>
    course.id === id ? { ...course, estado: !course.estado } : course
  );

export const removeCourse = (courses, id) =>
  courses.filter((course) => course.id !== id);
