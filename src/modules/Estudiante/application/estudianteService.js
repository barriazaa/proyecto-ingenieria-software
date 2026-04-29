import {
  isStudentRole,
  mapAssignedCourses,
  normalizeStudent,
} from "../domain/estudianteRules";
import FirebaseEstudianteRepository from "../infrastructure/FirebaseEstudianteRepository";
import AttendanceReportService from "../reportes/application/attendanceReportService";
import { calcularDistanciaMetros } from "../utils/geoUtils";

class EstudianteService {
  async getStudentDashboard(uid) {
    const studentProfile = await FirebaseEstudianteRepository.getStudentProfile(uid);

    if (!studentProfile) {
      throw new Error("No se encontró información del estudiante.");
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

  // --- MÉTODO PARA EL CÓDIGO QR CON GEOFENCE OPCIONAL ---
  async processAttendanceScan(scannedData, currentUser, coordsAlumno) {
    try {
      const { i: courseId, t: scannedToken } = scannedData;
      const hoy = new Date().toISOString().split('T')[0];

      // 1. Obtener Requisitos del Curso (Sincronizado con Firebase)
      const requirements = await FirebaseEstudianteRepository.getCourseRequirements(courseId);

      // 2. Validar Cerco Virtual SOLO si el curso lo requiere (requiereGPS)
      if (requirements.requiereGPS) {
        if (!coordsAlumno) {
          throw new Error("Este curso requiere ubicación obligatoria. Por favor, activa tu GPS.");
        }

        const sedeConfig = await FirebaseEstudianteRepository.getSedeConfig();
        const distancia = calcularDistanciaMetros(
          coordsAlumno.lat,
          coordsAlumno.lng,
          sedeConfig.ubicacion.latitude,
          sedeConfig.ubicacion.longitude
        );

        if (distancia > sedeConfig.radioMetros) {
          throw new Error(`Fuera de rango (${Math.round(distancia)}m). Acércate más a la sede.`);
        }
      }

      // 3. Validar si ya marcó asistencia hoy
      const yaRegistroHoy = await FirebaseEstudianteRepository.checkDuplicateAttendance(
        currentUser.uid,
        courseId,
        hoy
      );

      if (yaRegistroHoy) {
        throw new Error("Ya registraste tu asistencia para este curso el día de hoy.");
      }

      // 4. Obtener datos para el marcaje final
      const [courseData, studentProfile] = await Promise.all([
        FirebaseEstudianteRepository.getCourseById(courseId),
        FirebaseEstudianteRepository.getStudentProfile(currentUser.uid)
      ]);

      if (!courseData) throw new Error("Curso no encontrado.");

      // 5. Validar Token QR
      if (courseData.currentQrToken !== scannedToken) {
        throw new Error("El código QR ha expirado. Pide al docente generar uno nuevo.");
      }

      const student = normalizeStudent(studentProfile, currentUser.uid);

      // 6. Auto-inscripción (Si el alumno escanea y no está en el curso, lo metemos)
      if (!student.cursosAsignados.includes(courseId)) {
        await FirebaseEstudianteRepository.enrollStudentInCourse(currentUser.uid, courseId);
      }

      // 7. Guardar marcaje en la nueva colección agrupada 'asistencias_detalle'
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
        message: `Asistencia marcada correctamente en ${courseData.nombre}` 
      };
    } catch (error) {
      console.error("Error en Service Scan:", error.message);
      throw error;
    }
  }
}

export default new EstudianteService();