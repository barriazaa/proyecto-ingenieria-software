import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import CatedraticoService from "../application/CatedraticoService";

const buildPercentageStyle = (percentage) => ({
  ...styles.percentage,
  ...(percentage >= 70 ? styles.percentageGood : styles.percentageRisk),
});

const ReporteriaSection = ({ reporteria }) => {
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [attendanceError, setAttendanceError] = useState("");

  useEffect(() => {
    let unsubscribeAttendance = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeAttendance();
      setAttendanceDetails([]);
      setAttendanceError("");

      if (!firebaseUser) {
        return;
      }

      unsubscribeAttendance = CatedraticoService.subscribeToAttendanceDetails({
        docenteUid: firebaseUser.uid,
        onData: setAttendanceDetails,
        onError: (error) => {
          console.error(error);
          setAttendanceError("No se pudo escuchar asistencias en tiempo real.");
        },
      });
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeAuth();
    };
  }, []);

  const attendanceReport = useMemo(
    () => CatedraticoService.getAttendanceDashboardReport(attendanceDetails),
    [attendanceDetails]
  );

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
        {attendanceError ? <span style={styles.errorText}>{attendanceError}</span> : null}
      </div>

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
      </div>

      <div style={styles.coursePanel}>
        <h3 style={styles.sectionTitle}>Porcentaje por curso</h3>
        {attendanceReport.courses.length > 0 ? (
          <div style={styles.courseList}>
            {attendanceReport.courses.map((course) => (
              <div key={course.cursoId} style={styles.courseRow}>
                <div>
                  <strong style={styles.courseName}>{course.cursoNombre}</strong>
                  <span style={styles.courseMeta}>
                    {course.totalEstudiantes} estudiantes - {course.totalAsistencias} asistencias
                  </span>
                </div>
                <span style={buildPercentageStyle(course.porcentaje)}>
                  {course.porcentaje}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>Sin asistencias registradas todavia.</div>
        )}
      </div>
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
  errorText: {
    color: "#b91c1c",
    fontWeight: "700",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
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
