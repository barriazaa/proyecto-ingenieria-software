import { calculateAttendanceSummary } from "../domain/attendanceReportRules";

class AttendanceReportService {
  getCourseAttendanceSummary(course, attendances, range) {
    return calculateAttendanceSummary(course, attendances, range);
  }
}

export default new AttendanceReportService();
