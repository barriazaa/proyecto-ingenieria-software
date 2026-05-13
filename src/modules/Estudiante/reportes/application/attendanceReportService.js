import { calculateAttendanceSummary } from "../domain/attendanceReportRules";

class AttendanceReportService {
  /**
   * Genera el resumen de asistencia para un curso específico.
   * @param {Object} course - Los datos del curso (nombre, código, etc.)
   * @param {Array} allAttendances - El array de documentos que viene del repositorio.
   * @param {Object} range - El rango de fechas seleccionado.
   */
  getCourseAttendanceSummary(course, allAttendances, range) {
    // 1. Buscamos el registro de asistencia que le pertenece a este curso.
    // Recordá que el repositorio ya filtró por estudiante, aquí filtramos por curso.
    const courseRecord = allAttendances.find(
      (attendance) => attendance.cursoId === course.id
    );

    // 2. Lógica de "Documento inexistente = 0 marcajes"
    // Si existe el documento, tomamos el array 'fechasAsistencia' y lo preparamos.
    // Si no existe, pasamos un array vacío para que el reporte no truene y dé 0%.
    const attendanceDates = courseRecord 
      ? (courseRecord.fechasAsistencia || []).map(fecha => ({ fecha })) 
      : [];

    // 3. Llamamos a tus reglas de dominio pasándole la lista de fechas.
    const summary = calculateAttendanceSummary(course, attendanceDates, range);

    // 4. Retornamos el resumen con el extra del nombre profesional.
    return {
      ...summary,
      // Esto asegura que en el H2 siempre se vea "[Código] - Nombre"
      // aunque el registro de asistencia esté vacío.
      courseDisplayName: summary.courseDisplayName || `${course.codigo || 'S/C'} - ${course.nombre}`
    };
  }
}

export default new AttendanceReportService();
