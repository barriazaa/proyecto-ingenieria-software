import {
  isStudentRole,
  mapAssignedCourses,
  normalizeStudent,
} from "../domain/estudianteRules";
import FirebaseEstudianteRepository from "../infrastructure/FirebaseEstudianteRepository";
import AttendanceReportService from "../reportes/application/attendanceReportService";

// Importamos la herramienta matemática desde tu nueva carpeta
import { calcularDistanciaMetros } from "../utils/geoUtils";

class EstudianteService {
  async getStudentDashboard(uid) {
    const studentProfile = await FirebaseEstudianteRepository.getStudentProfile(uid);

    if (!studentProfile) {
      throw new Error("No se encontro informacion del estudiante.");
    }

    if (!isStudentRole(studentProfile.rol)) {
      return {
        authorized: false,
        student: normalizeStudent(studentProfile, uid),
        courses: [],
        attendances: [],
      };
    }

    const student = normalizeStudent(studentProfile, uid);
    const [assignedCourses, attendances] = await Promise.all([
      FirebaseEstudianteRepository.getAssignedCourses(student.cursosAsignados),
      FirebaseEstudianteRepository.getStudentAttendances(student),
    ]);

    return {
      authorized: true,
      student,
      courses: mapAssignedCourses(assignedCourses, student.cursosAsignados, studentProfile),
      attendances,
    };
  }

  getCourseAttendanceSummary(course, attendances, range) {
    return AttendanceReportService.getCourseAttendanceSummary(course, attendances, range);
  }

  // --- MÉTODO PARA EL CÓDIGO QR CON GEOFENCE ---
  async processAttendanceScan(scannedData, currentUser, coordsAlumno) {
    try {
      const { i: courseId, t: scannedToken } = scannedData;
      const hoy = new Date().toISOString().split('T')[0];

      // 1. Validar Cerco Virtual (Geofencing)
      const sedeConfig = await FirebaseEstudianteRepository.getSedeConfig();
      const distancia = calcularDistanciaMetros(
        coordsAlumno.lat,
        coordsAlumno.lng,
        sedeConfig.ubicacion.latitude,
        sedeConfig.ubicacion.longitude
      );

      if (distancia > sedeConfig.radioMetros) {
        throw new Error(`Estás fuera del rango permitido (${Math.round(distancia)}m). Acércate más al colegio.`);
      }

      // 2. Validar si ya marcó asistencia hoy
      const yaRegistroHoy = await FirebaseEstudianteRepository.checkDuplicateAttendance(
        currentUser.uid,
        courseId,
        hoy
      );

      if (yaRegistroHoy) {
        throw new Error("Ya registraste tu asistencia para este curso el día de hoy.");
      }

      // 3. Obtener datos del curso y del estudiante
      const [courseData, studentProfile] = await Promise.all([
        FirebaseEstudianteRepository.getCourseById(courseId),
        FirebaseEstudianteRepository.getStudentProfile(currentUser.uid)
      ]);

      if (!courseData) throw new Error("Curso no encontrado.");

      // 4. Validar que el token del QR sea el correcto/actual
      if (courseData.currentQrToken !== scannedToken) {
        throw new Error("El código QR ha expirado o no es válido. Escanea el código actual.");
      }

      const student = normalizeStudent(studentProfile, currentUser.uid);

      // 5. Auto-inscribir si es necesario
      if (!student.cursosAsignados.includes(courseId)) {
        await FirebaseEstudianteRepository.enrollStudentInCourse(currentUser.uid, courseId);
      }

      // 6. Guardar el marcaje en la colección de asistencias
      await FirebaseEstudianteRepository.saveAttendanceReport({
        estudianteUid: student.uid,
        estudianteNombre: student.nombre,
        estudianteCarnet: student.carnet,
        cursoId: courseData.id,
        cursoNombre: courseData.nombre,
        seccion: courseData.seccion || "N/A",
        docenteUid: courseData.teacherUid || courseData.docenteId,
        fechaSimple: hoy
      });

      return { 
        success: true, 
        message: `Asistencia validada en sede y marcada en ${courseData.nombre}` 
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new EstudianteService();