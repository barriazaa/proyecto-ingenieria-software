import { useEffect, useMemo, useState } from "react";
import CatedraticoService from "../application/CatedraticoService";
import AttendancePieChart from "./AttendancePieChart";
import DateRangePicker from "./DateRangePicker";
import StudentAttendanceReport from "./StudentAttendanceReport";
import {
  getEmptyDateRange,
  isCompleteDateRange,
} from "./dateRangeUtils";

const normalizeInitialDateRange = (range) =>
  isCompleteDateRange(range)
    ? { fechaInicio: range.fechaInicio, fechaFin: range.fechaFin }
    : getEmptyDateRange();

const buildStatusStyle = (estado) => ({
  ...styles.statusPill,
  ...(estado === "Activo" ? styles.statusActive : styles.statusInactive),
});

const buildPercentageStyle = (percentage) => ({
  ...styles.percentagePill,
  ...(percentage >= 70 ? styles.percentageGood : styles.percentageRisk),
});

const buildAbsencePercentageStyle = (percentage) => ({
  ...styles.percentagePill,
  ...(percentage <= 30 ? styles.percentageGood : styles.percentageRisk),
});

const getStudentRowKey = (student) =>
  String(
    student?._studentReportKey ||
      student?.estudianteUid ||
      student?.uid ||
      student?.id ||
      student?.estudianteCarnet ||
      student?.carnet ||
      student?.estudianteNombre ||
      ""
  );

const CourseAttendanceReport = ({ course, currentTeacher, initialDateRange, onClose }) => {
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [selectedStudentKey, setSelectedStudentKey] = useState("");
  const [dateRange, setDateRange] = useState(() =>
    normalizeInitialDateRange(initialDateRange)
  );
  const initialFechaInicio = initialDateRange?.fechaInicio || "";
  const initialFechaFin = initialDateRange?.fechaFin || "";

  useEffect(() => {
    setDateRange(
      normalizeInitialDateRange({
        fechaInicio: initialFechaInicio,
        fechaFin: initialFechaFin,
      })
    );
  }, [initialFechaFin, initialFechaInicio]);

  useEffect(() => {
    setSelectedStudentKey("");
  }, [course?.id]);

  useEffect(() => {
    if (!currentTeacher?.uid || !course?.id) {
      return () => {};
    }

    const unsubscribe = CatedraticoService.subscribeToAttendanceDetails({
      docenteUid: currentTeacher.uid,
      cursoId: course.id,
      onData: (details) => {
        setAttendanceDetails(details);
        setLoading(false);
      },
      onError: (subscriptionError) => {
        console.error(subscriptionError);
        setError("No se pudo escuchar este curso en tiempo real.");
        setLoading(false);
      },
    });

    return () => unsubscribe();
  }, [course?.id, currentTeacher?.uid]);

  useEffect(() => {
    let isMounted = true;

    if (!course?.id) {
      setAssignedStudents([]);
      setStudentsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadAssignedStudents = async () => {
      try {
        setStudentsLoading(true);
        setStudentsError("");
        const students = await CatedraticoService.getStudentsAssignedToCourse(course.id);

        if (isMounted) {
          setAssignedStudents(students);
        }
      } catch (loadError) {
        console.error(loadError);

        if (isMounted) {
          setStudentsError("No se pudieron cargar estudiantes asignados al curso.");
          setAssignedStudents([]);
        }
      } finally {
        if (isMounted) {
          setStudentsLoading(false);
        }
      }
    };

    loadAssignedStudents();

    return () => {
      isMounted = false;
    };
  }, [course?.id]);

  const appliedDateRange = isCompleteDateRange(dateRange) ? dateRange : null;

  const report = useMemo(
    () =>
      CatedraticoService.getCourseAttendanceReport(
        attendanceDetails,
        course,
        appliedDateRange,
        assignedStudents
      ),
    [attendanceDetails, course, appliedDateRange, assignedStudents]
  );

  const selectedStudent = useMemo(
    () =>
      report.students.find(
        (student, index) =>
          (getStudentRowKey(student) || `student-${index}`) === selectedStudentKey
      ) || null,
    [report.students, selectedStudentKey]
  );

  const dateRangeMeta = appliedDateRange
    ? `${report.clasesEsperadas} clases esperadas`
    : "Usando historial completo";

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <span style={styles.badge}>Actualizado</span>
            <h2 style={styles.title}>Asistencias: {course.nombre}</h2>
            <p style={styles.subtitle}>
              Seccion {course.seccion || "N/A"} - {report.totalEstudiantes} estudiantes
            </p>
          </div>
          <button type="button" style={styles.closeIconButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div style={styles.dateFilterWrap}>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            rangeMeta={dateRangeMeta}
          />
        </div>

        <div style={styles.reportOverview}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <span style={styles.label}>Estudiantes</span>
              <strong style={styles.value}>{report.totalEstudiantes}</strong>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.label}>Asistencias</span>
              <strong style={styles.value}>{report.totalAsistencias}</strong>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.label}>Inasistencias</span>
              <strong style={styles.value}>{report.totalInasistencias}</strong>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.label}>Clases esperadas</span>
              <strong style={styles.value}>{report.clasesEsperadas}</strong>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.label}>% asistencia</span>
              <strong style={styles.value}>{report.porcentajeAsistencia}%</strong>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.label}>% inasistencia</span>
              <strong style={styles.value}>{report.porcentajeInasistencia}%</strong>
            </div>
          </div>

          <AttendancePieChart report={report} title="Detalle del curso" />
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {studentsError ? <div style={styles.warningBox}>{studentsError}</div> : null}

        {!currentTeacher?.uid ? (
          <div style={styles.emptyState}>No se encontro un catedratico activo.</div>
        ) : loading || studentsLoading ? (
          <div style={styles.emptyState}>Escuchando asistencias...</div>
        ) : report.students.length > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Estudiante</th>
                  <th style={styles.th}>Carnet</th>
                  <th style={styles.th}>Asistencias</th>
                  <th style={styles.th}>Inasistencias</th>
                  <th style={styles.th}>% Asistencia</th>
                  <th style={styles.th}>% Inasistencia</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Reporte</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((student, index) => {
                  const studentKey = getStudentRowKey(student);
                  const rowKey = studentKey || `student-${index}`;

                  return (
                    <tr key={rowKey}>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.studentNameButton}
                          onClick={() => setSelectedStudentKey(rowKey)}
                        >
                          {student.estudianteNombre}
                        </button>
                      </td>
                      <td style={styles.td}>{student.estudianteCarnet}</td>
                      <td style={styles.td}>
                        <strong>{student.totalAsistencias}</strong>
                      </td>
                      <td style={styles.td}>
                        <strong>{student.totalInasistencias}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={buildPercentageStyle(student.porcentajeAsistencia)}>
                          {student.porcentajeAsistencia}%
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={buildAbsencePercentageStyle(student.porcentajeInasistencia)}>
                          {student.porcentajeInasistencia}%
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={buildStatusStyle(student.estado)}>{student.estado}</span>
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.detailButton}
                          onClick={() => setSelectedStudentKey(rowKey)}
                        >
                          Ver reporte
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>No hay estudiantes asignados para este curso.</div>
        )}

        {selectedStudent ? (
          <StudentAttendanceReport
            student={selectedStudent}
            course={course}
            courseReport={report}
            dateRange={appliedDateRange}
            onClose={() => setSelectedStudentKey("")}
          />
        ) : null}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 2100,
  },
  modal: {
    width: "100%",
    maxWidth: "920px",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 25px 70px rgba(0, 0, 0, 0.28)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  badge: {
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
  title: {
    margin: 0,
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
  },
  closeIconButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  dateFilterWrap: {
    marginBottom: "18px",
  },
  reportOverview: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    alignItems: "start",
    marginBottom: "18px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },
  summaryCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
  },
  label: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "8px",
  },
  value: {
    color: "#0f172a",
    fontSize: "26px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "1040px",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a",
  },
  studentNameButton: {
    border: 0,
    background: "transparent",
    color: "#2563eb",
    padding: 0,
    cursor: "pointer",
    font: "inherit",
    fontWeight: "800",
    textAlign: "left",
  },
  detailButton: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "8px 11px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  statusPill: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  statusActive: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusInactive: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  percentagePill: {
    display: "inline-flex",
    minWidth: "58px",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
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
  errorBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: "700",
  },
  warningBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: "700",
  },
  emptyState: {
    padding: "22px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "16px",
    fontWeight: "700",
  },
};

export default CourseAttendanceReport;
