import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import CatedraticoService from "../application/CatedraticoService";
import { filterStudentsByCourse } from "../domain/CatedraticoRules";
import { getCourses } from "../../cursos/application/courseService";
import AttendancePieChart from "./AttendancePieChart";
import CourseAttendanceReport from "./CourseAttendanceReport";
import DateRangePicker from "./DateRangePicker";
import {
  getEmptyDateRange,
  isCompleteDateRange,
} from "./dateRangeUtils";

const getCourseOwnerUid = (course) =>
  course?.teacherUid || course?.docenteUid || course?.ownerUid || course?.createdBy || "";

const courseBelongsToTeacher = (course, teacher) => {
  const courseOwnerUid = getCourseOwnerUid(course);
  return Boolean(teacher?.uid && courseOwnerUid && String(courseOwnerUid) === String(teacher.uid));
};

const findCourseMetadata = (courseSummary, courseMetadata) =>
  courseMetadata.find((course) => String(course.id) === String(courseSummary.cursoId));

const buildCourseForDetail = (courseSummary, courseMetadata) => {
  const metadata = findCourseMetadata(courseSummary, courseMetadata);

  return {
    id: courseSummary.cursoId,
    nombre: courseSummary.cursoNombre,
    seccion: courseSummary.seccion,
    ...(metadata || {}),
  };
};

const buildPercentageStyle = (percentage) => ({
  ...styles.percentage,
  ...(percentage >= 70 ? styles.percentageGood : styles.percentageRisk),
});

const ReporteriaSection = ({ reporteria, estudiantes = [] }) => {
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [attendanceError, setAttendanceError] = useState("");
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [dateRange, setDateRange] = useState(getEmptyDateRange);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeAttendance = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeAttendance();
      setAttendanceDetails([]);
      setAttendanceError("");
      setCoursesError("");
      setSelectedCourse(null);

      if (!firebaseUser) {
        setCurrentTeacher(null);
        setCourses([]);
        setCoursesLoading(false);
        return;
      }

      const teacher = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
      };

      setCurrentTeacher(teacher);
      setCoursesLoading(true);

      getCourses()
        .then((loadedCourses) => {
          if (isMounted) {
            setCourses(loadedCourses);
          }
        })
        .catch((error) => {
          console.error(error);

          if (isMounted) {
            setCourses([]);
            setCoursesError("No se pudieron cargar cursos para completar el calculo.");
          }
        })
        .finally(() => {
          if (isMounted) {
            setCoursesLoading(false);
          }
        });

      unsubscribeAttendance = CatedraticoService.subscribeToAttendanceDetails({
        docenteUid: firebaseUser.uid,
        onData: (details) => {
          if (isMounted) {
            setAttendanceDetails(details);
          }
        },
        onError: (error) => {
          console.error(error);

          if (isMounted) {
            setAttendanceError("No se pudo escuchar asistencias en tiempo real.");
          }
        },
      });
    });

    return () => {
      isMounted = false;
      unsubscribeAttendance();
      unsubscribeAuth();
    };
  }, []);

  const appliedDateRange = isCompleteDateRange(dateRange) ? dateRange : null;
  const attendanceCourseIds = useMemo(
    () =>
      Array.from(
        new Set(
          attendanceDetails
            .map((detail) => String(detail.cursoId || ""))
            .filter(Boolean)
        )
      ),
    [attendanceDetails]
  );
  const attendanceCourseIdSet = useMemo(
    () => new Set(attendanceCourseIds),
    [attendanceCourseIds]
  );
  const reportCourseMetadata = useMemo(
    () =>
      courses.filter((course) => {
        const courseId = String(course.id || "");
        return attendanceCourseIdSet.has(courseId) || courseBelongsToTeacher(course, currentTeacher);
      }),
    [attendanceCourseIdSet, courses, currentTeacher]
  );
  const reportCourseIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...attendanceCourseIds,
          ...reportCourseMetadata.map((course) => String(course.id || "")).filter(Boolean),
        ])
      ),
    [attendanceCourseIds, reportCourseMetadata]
  );
  const assignedStudentsByCourse = useMemo(() => {
    const studentsByCourse = {};

    reportCourseIds.forEach((courseId) => {
      studentsByCourse[courseId] = filterStudentsByCourse(estudiantes, courseId);
    });

    return studentsByCourse;
  }, [estudiantes, reportCourseIds]);
  const attendanceReport = useMemo(
    () =>
      CatedraticoService.getAttendanceDashboardReport(attendanceDetails, {
        dateRange: appliedDateRange,
        courses: reportCourseMetadata,
        assignedStudentsByCourse,
      }),
    [appliedDateRange, assignedStudentsByCourse, attendanceDetails, reportCourseMetadata]
  );
  const dateRangeMeta = appliedDateRange
    ? "Calculando asistencias esperadas segun los dias del curso."
    : "Usando historial completo registrado.";
  const reportStatusText = coursesLoading
    ? "Cargando cursos para completar estadisticas..."
    : coursesError;

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>
        <div style={styles.card}>
          <span style={styles.label}>Total estudiantes</span>
          <strong style={styles.value}>{reporteria.totalEstudiantes}</strong>
        </div>
        <div style={styles.card}>
          <span style={styles.label}>Total cursos</span>
          <strong style={styles.value}>{reporteria.totalCursos}</strong>
        </div>
        <div style={styles.card}>
          <span style={styles.label}>Cursos activos</span>
          <strong style={styles.value}>{reporteria.cursosActivos}</strong>
        </div>
      </div>

      <div style={styles.liveHeader}>
        <div>
          <span style={styles.liveBadge}>ASISTENCIA</span>
          <h3 style={styles.sectionTitle}>Asistencias registradas</h3>
        </div>
        <div style={styles.statusMessages}>
          {attendanceError ? <span style={styles.errorText}>{attendanceError}</span> : null}
          {reportStatusText ? <span style={styles.mutedText}>{reportStatusText}</span> : null}
        </div>
      </div>

      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        title="Filtro general de fechas"
        rangeMeta={dateRangeMeta}
      />

      <div style={styles.grid}>
        <div style={styles.card}>
          <span style={styles.label}>Cursos con asistencia</span>
          <strong style={styles.value}>{attendanceReport.totalCursosUnicos}</strong>
        </div>
        <div style={styles.card}>
          <span style={styles.label}>Estudiantes unicos</span>
          <strong style={styles.value}>{attendanceReport.totalEstudiantesUnicos}</strong>
        </div>
        <div style={styles.card}>
          <span style={styles.label}>Asistencias acumuladas</span>
          <strong style={styles.value}>{attendanceReport.totalAsistencias}</strong>
        </div>
        <div style={styles.card}>
          <span style={styles.label}>Inasistencias calculadas</span>
          <strong style={styles.value}>{attendanceReport.totalInasistencias}</strong>
        </div>
        <div style={styles.card}>
          <span style={styles.label}>Promedio asistencia</span>
          <strong style={styles.value}>{attendanceReport.porcentajeAsistencia}%</strong>
        </div>
        <div style={styles.card}>
          <span style={styles.label}>Promedio inasistencia</span>
          <strong style={styles.value}>{attendanceReport.porcentajeInasistencia}%</strong>
        </div>
      </div>

      <div style={styles.reportLayout}>
        <div style={styles.coursePanel}>
          <h3 style={styles.sectionTitle}>Porcentaje por curso</h3>
          {attendanceReport.courses.length > 0 ? (
            <div style={styles.courseList}>
              {attendanceReport.courses.map((course) => (
                <button
                  key={course.cursoId}
                  type="button"
                  style={styles.courseRow}
                  onClick={() => setSelectedCourse(buildCourseForDetail(course, reportCourseMetadata))}
                >
                  <div style={styles.courseInfo}>
                    <strong style={styles.courseName}>{course.cursoNombre}</strong>
                    <span style={styles.courseMeta}>
                      {course.totalEstudiantes} estudiantes - {course.totalAsistencias} asistencias
                    </span>
                    <span style={styles.courseMeta}>
                      {course.totalInasistencias} inasistencias - {course.clasesEsperadas} clases esperadas
                    </span>
                  </div>
                  <div style={styles.courseStats}>
                    <span style={buildPercentageStyle(course.porcentaje)}>
                      {course.porcentaje}%
                    </span>
                    <span style={styles.courseAction}>Ver Reportes</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>Sin asistencias registradas todavia.</div>
          )}
        </div>

        <AttendancePieChart report={attendanceReport} title="Resumen general" />
      </div>

      {selectedCourse && currentTeacher ? (
        <CourseAttendanceReport
          course={selectedCourse}
          currentTeacher={currentTeacher}
          initialDateRange={appliedDateRange}
          onClose={() => setSelectedCourse(null)}
        />
      ) : null}
    </div>
  );
};

const styles = {
  wrapper: {
    display: "grid",
    gap: "18px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #e2e8f0",
  },
  label: {
    display: "block",
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "8px",
  },
  value: {
    fontSize: "28px",
    color: "#0f172a",
  },
  liveHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  liveBadge: {
    display: "inline-flex",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "20px",
  },
  statusMessages: {
    display: "grid",
    gap: "6px",
    justifyItems: "end",
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  mutedText: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },
  reportLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    alignItems: "start",
  },
  coursePanel: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
  },
  courseList: {
    display: "grid",
    gap: "12px",
    marginTop: "14px",
  },
  courseRow: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  courseInfo: {
    minWidth: 0,
  },
  courseName: {
    display: "block",
    color: "#0f172a",
  },
  courseMeta: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginTop: "4px",
  },
  courseStats: {
    display: "grid",
    justifyItems: "end",
    gap: "6px",
    flex: "0 0 auto",
  },
  courseAction: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "800",
  },
  percentage: {
    minWidth: "64px",
    textAlign: "center",
    padding: "8px 10px",
    borderRadius: "999px",
    fontWeight: "800",
  },
  percentageGood: {
    background: "#dcfce7",
    color: "#166534",
  },
  percentageRisk: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  emptyState: {
    marginTop: "14px",
    padding: "18px",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#64748b",
    textAlign: "center",
    fontWeight: "700",
  },
};

export default ReporteriaSection;
