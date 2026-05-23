import {
  createCatedraticoCards,
  filterStudentsByCourse,
  mapStudentsForView,
} from "../domain/CatedraticoRules";
import {
  buildStudentAttendanceReport,
  normalizeAttendanceDetail,
  summarizeCourseAttendance,
  summarizeTeacherAttendanceDashboard,
} from "../domain/attendanceDetailRules";
import FirebaseAttendanceDetailsRepository from "../infrastructure/FirebaseAttendanceDetailsRepository";
import FirebaseCatedraticoRepository from "../infrastructure/FirebaseCatedraticoRepository";

class CatedraticoService {
  async getDashboardData() {
    const [reporteria, estudiantes] = await Promise.all([
      FirebaseCatedraticoRepository.getReporteria(),
      FirebaseCatedraticoRepository.getEstudiantes(),
    ]);

    return {
      reporteria,
      estudiantes: mapStudentsForView(estudiantes),
      cards: createCatedraticoCards(reporteria),
    };
  }

  async updateStudent(student) {
    const updatedStudent = await FirebaseCatedraticoRepository.updateStudent(student);
    return mapStudentsForView([updatedStudent])[0];
  }

  async getStudentsAssignedToCourse(courseId) {
    const students = await FirebaseCatedraticoRepository.getEstudiantes();
    const studentsForView = mapStudentsForView(students);
    return filterStudentsByCourse(studentsForView, courseId);
  }

  subscribeToAttendanceDetails({ docenteUid, cursoId, onData, onError }) {
    return FirebaseAttendanceDetailsRepository.subscribeToTeacherAttendanceDetails({
      docenteUid,
      cursoId,
      onData: (attendanceDetails) =>
        onData(attendanceDetails.map(normalizeAttendanceDetail)),
      onError,
    });
  }

  getCourseAttendanceReport(attendanceDetails, course, dateRange, assignedStudents = []) {
    return summarizeCourseAttendance(attendanceDetails, course, dateRange, assignedStudents);
  }

  getStudentAttendanceReport(courseReport, student, course, dateRange) {
    return buildStudentAttendanceReport(courseReport, student, course, dateRange);
  }

  getAttendanceDashboardReport(attendanceDetails, options = {}) {
    return summarizeTeacherAttendanceDashboard(attendanceDetails, options);
  }
}

export default new CatedraticoService(); 
