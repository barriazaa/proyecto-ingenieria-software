import { useEffect, useMemo, useState } from "react";
import CatedraticoService from "../application/CatedraticoService";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) {
    return "Sin definir";
  }

  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
};

const getInitialCalendarMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

const addMonths = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const buildCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const placeholders = Array.from({ length: firstDay.getDay() }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    return {
      date,
      key: toDateKey(date),
      dayNumber: index + 1,
    };
  });

  return [...placeholders, ...days];
};

const isCompleteRange = (range) => Boolean(range.fechaInicio && range.fechaFin);

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

const CourseAttendanceReport = ({ course, currentTeacher, onClose }) => {
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [dateRange, setDateRange] = useState({ fechaInicio: "", fechaFin: "" });
  const [visibleMonth, setVisibleMonth] = useState(getInitialCalendarMonth);

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

  const appliedDateRange = isCompleteRange(dateRange) ? dateRange : null;
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const rangeLabel = appliedDateRange
    ? `${formatDateLabel(appliedDateRange.fechaInicio)} - ${formatDateLabel(
        appliedDateRange.fechaFin
      )}`
    : dateRange.fechaInicio
      ? `${formatDateLabel(dateRange.fechaInicio)} - Sin definir`
      : "Rango completo";

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

  const handleCalendarDateClick = (dateKey) => {
    setDateRange((currentRange) => {
      if (!currentRange.fechaInicio || currentRange.fechaFin) {
        return { fechaInicio: dateKey, fechaFin: "" };
      }

      if (dateKey < currentRange.fechaInicio) {
        return { fechaInicio: dateKey, fechaFin: currentRange.fechaInicio };
      }

      return { fechaInicio: currentRange.fechaInicio, fechaFin: dateKey };
    });
  };

  const clearDateRange = () => {
    setDateRange({ fechaInicio: "", fechaFin: "" });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <span style={styles.badge}>Tiempo real</span>
            <h2 style={styles.title}>Asistencias: {course.nombre}</h2>
            <p style={styles.subtitle}>
              Seccion {course.seccion || "N/A"} - {report.totalEstudiantes} estudiantes
            </p>
          </div>
          <button type="button" style={styles.closeIconButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div style={styles.dateFilter}>
          <div style={styles.dateFilterInfo}>
            <span style={styles.label}>Rango de fechas</span>
            <strong style={styles.rangeText}>{rangeLabel}</strong>
            <span style={styles.rangeMeta}>
              {appliedDateRange
                ? `${report.clasesEsperadas} clases esperadas`
                : "Usando historial completo"}
            </span>
            <button
              type="button"
              style={{
                ...styles.clearButton,
                ...(!dateRange.fechaInicio && !dateRange.fechaFin ? styles.buttonDisabled : {}),
              }}
              onClick={clearDateRange}
              disabled={!dateRange.fechaInicio && !dateRange.fechaFin}
            >
              Limpiar rango
            </button>
          </div>

          <div style={styles.calendar}>
            <div style={styles.calendarHeader}>
              <button
                type="button"
                style={styles.calendarNavButton}
                onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
              >
                {"<"}
              </button>
              <strong style={styles.calendarTitle}>
                {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </strong>
              <button
                type="button"
                style={styles.calendarNavButton}
                onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
              >
                {">"}
              </button>
            </div>

            <div style={styles.weekDays}>
              {WEEKDAY_LABELS.map((day) => (
                <span key={day} style={styles.weekDay}>
                  {day}
                </span>
              ))}
            </div>

            <div style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <span key={`empty-${index}`} style={styles.calendarPlaceholder} />;
                }

                const isRangeStart = day.key === dateRange.fechaInicio;
                const isRangeEnd = day.key === dateRange.fechaFin;
                const isInsideRange =
                  appliedDateRange &&
                  day.key > appliedDateRange.fechaInicio &&
                  day.key < appliedDateRange.fechaFin;
                const isToday = day.key === todayKey;

                return (
                  <button
                    key={day.key}
                    type="button"
                    style={{
                      ...styles.calendarDay,
                      ...(isInsideRange ? styles.calendarDayInRange : {}),
                      ...(isToday ? styles.calendarDayToday : {}),
                      ...(isRangeStart || isRangeEnd ? styles.calendarDaySelected : {}),
                    }}
                    onClick={() => handleCalendarDateClick(day.key)}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
            <span style={styles.label}>Porcentaje</span>
            <strong style={styles.value}>{report.porcentaje}%</strong>
          </div>
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
                  <th style={styles.th}>% Asistencia</th>
                  <th style={styles.th}>% Inasistencia</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((student) => (
                  <tr key={student.estudianteUid || student.estudianteCarnet || student.id}>
                    <td style={styles.td}>{student.estudianteNombre}</td>
                    <td style={styles.td}>{student.estudianteCarnet}</td>
                    <td style={styles.td}>
                      <strong>{student.totalAsistencias}</strong>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>No hay estudiantes asignados para este curso.</div>
        )}
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },
  dateFilter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    alignItems: "start",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "18px",
  },
  dateFilterInfo: {
    display: "grid",
    alignContent: "start",
    gap: "8px",
  },
  rangeText: {
    color: "#0f172a",
    fontSize: "20px",
  },
  rangeMeta: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },
  clearButton: {
    justifySelf: "start",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "9px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  calendar: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  calendarTitle: {
    color: "#0f172a",
    fontSize: "15px",
  },
  calendarNavButton: {
    width: "34px",
    height: "34px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "800",
  },
  weekDays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(28px, 1fr))",
    gap: "6px",
    marginBottom: "6px",
  },
  weekDay: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    textAlign: "center",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(28px, 1fr))",
    gap: "6px",
  },
  calendarPlaceholder: {
    minHeight: "34px",
  },
  calendarDay: {
    minHeight: "34px",
    border: "1px solid transparent",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  calendarDayToday: {
    borderColor: "#2563eb",
  },
  calendarDayInRange: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  calendarDaySelected: {
    background: "#2563eb",
    color: "#ffffff",
    borderColor: "#2563eb",
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
    minWidth: "820px",
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
