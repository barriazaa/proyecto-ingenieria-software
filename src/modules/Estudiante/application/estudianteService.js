import {
  isStudentRole,
  mapAssignedCourses,
  normalizeStudent,
} from "../domain/estudianteRules";
import FirebaseEstudianteRepository
from "../infrastructure/FirebaseEstudianteRepository";
import AttendanceReportService
from "../reportes/application/attendanceReportService";

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
}

export default new EstudianteService(); 
