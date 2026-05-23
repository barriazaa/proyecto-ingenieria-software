import { useMemo } from "react";
import CatedraticoService from "../application/CatedraticoService";
import AttendancePieChart from "./AttendancePieChart";
import { formatDateLabel } from "./dateRangeUtils";

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

const parseDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const buildMonthDays = (monthKey, historyByDate) => {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const placeholders = Array.from({ length: firstDay.getDay() }, (_, index) => ({
    id: `empty-${monthKey}-${index}`,
    empty: true,
  }));
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(
      2,
      "0"
    )}`;

    return {
      id: dateKey,
      dateKey,
      dayNumber,
      attendance: historyByDate.get(dateKey),
    };
  });

  return [...placeholders, ...days];
};

const buildMonthGroups = (history) => {
  const historyByDate = new Map(history.map((item) => [item.fecha, item]));
  const monthKeys = Array.from(
    new Set(history.map((item) => String(item.fecha || "").slice(0, 7)).filter(Boolean))
  ).sort();

  return monthKeys.map((monthKey) => {
    const sampleDate = parseDateKey(`${monthKey}-01`);

    return {
      monthKey,
      title: sampleDate
        ? `${MONTH_NAMES[sampleDate.getMonth()]} ${sampleDate.getFullYear()}`
        : monthKey,
      days: buildMonthDays(monthKey, historyByDate),
    };
  });
};

const getDateRangeLabel = (studentReport) =>
  studentReport?.rangoAplicado
    ? `${formatDateLabel(studentReport.rangoAplicado.fechaInicio)} - ${formatDateLabel(
        studentReport.rangoAplicado.fechaFin
      )}`
    : "Historial completo disponible";

const SummaryCard = ({ label, value }) => (
  <div style={styles.summaryCard}>
    <span style={styles.label}>{label}</span>
    <strong style={styles.value}>{value}</strong>
  </div>
);

const StudentAttendanceReport = ({
  student,
  course,
  courseReport,
  dateRange,
  onClose,
}) => {
  const studentReport = useMemo(
    () => CatedraticoService.getStudentAttendanceReport(courseReport, student, course, dateRange),
    [course, courseReport, dateRange, student]
  );
  const monthGroups = useMemo(
    () => buildMonthGroups(studentReport.historial || []),
    [studentReport.historial]
  );
  const rangeLabel = getDateRangeLabel(studentReport);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <div>
            <span style={styles.badge}>Reporte individual</span>
            <h2 style={styles.title}>{studentReport.estudianteNombre}</h2>
            <p style={styles.subtitle}>
              Carnet {studentReport.estudianteCarnet} - {studentReport.cursoNombre}
            </p>
            <p style={styles.rangeText}>{rangeLabel}</p>
          </div>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div style={styles.reportOverview}>
          <div style={styles.summaryGrid}>
            <SummaryCard label="Asistencias" value={studentReport.totalAsistencias} />
            <SummaryCard label="Inasistencias" value={studentReport.totalInasistencias} />
            <SummaryCard label="Pendientes" value={studentReport.totalPendientes} />
            <SummaryCard label="% asistencia" value={`${studentReport.porcentajeAsistencia}%`} />
            <SummaryCard
              label="% inasistencia"
              value={`${studentReport.porcentajeInasistencia}%`}
            />
            <SummaryCard label="Clases esperadas" value={studentReport.clasesEsperadas} />
            <SummaryCard label="Fechas mostradas" value={studentReport.historial.length} />
          </div>

          <AttendancePieChart report={studentReport} title="Detalle del estudiante" />
        </div>

        <div style={styles.calendarPanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.label}>Calendario de asistencias</span>
              <h3 style={styles.panelTitle}>Historial por fecha</h3>
            </div>
            <div style={styles.legend}>
              <span style={styles.legendItem}>
                <i style={{ ...styles.dot, background: "#16a34a" }} />
                Asistencia
              </span>
              <span style={styles.legendItem}>
                <i style={{ ...styles.dot, background: "#dc2626" }} />
                Inasistencia
              </span>
              <span style={styles.legendItem}>
                <i style={{ ...styles.dot, background: "#2563eb" }} />
                Pendiente
              </span>
            </div>
          </div>

          {monthGroups.length > 0 ? (
            <div style={styles.monthGrid}>
              {monthGroups.map((month) => (
                <div key={month.monthKey} style={styles.monthCard}>
                  <strong style={styles.monthTitle}>{month.title}</strong>
                  <div style={styles.weekDays}>
                    {WEEKDAY_LABELS.map((day) => (
                      <span key={day} style={styles.weekDay}>
                        {day}
                      </span>
                    ))}
                  </div>
                  <div style={styles.calendarGrid}>
                    {month.days.map((day) => {
                      if (day.empty) {
                        return <span key={day.id} style={styles.calendarPlaceholder} />;
                      }

                      const attendanceStyle = day.attendance
                        ? day.attendance.asistio
                          ? styles.attendedDay
                          : day.attendance.pendiente
                            ? styles.pendingDay
                            : styles.absentDay
                        : styles.outsideClassDay;
                      const title = day.attendance
                        ? `${day.attendance.fechaLabel}: ${day.attendance.estado}`
                        : "Sin clase registrada";

                      return (
                        <span
                          key={day.id}
                          style={{ ...styles.calendarDay, ...attendanceStyle }}
                          title={title}
                        >
                          {day.dayNumber}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              No hay fechas de clase para mostrar en este rango.
            </div>
          )}
        </div>

        <div style={styles.historyPanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.label}>Lista cronologica</span>
              <h3 style={styles.panelTitle}>Detalle por fecha</h3>
            </div>
            <strong style={styles.historyCount}>{studentReport.historial.length} fechas</strong>
          </div>

          {studentReport.historial.length > 0 ? (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.historial.map((attendance) => (
                    <tr key={attendance.id}>
                      <td style={styles.td}>{attendance.fechaLabel}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusPill,
                            ...(attendance.asistio
                              ? styles.statusAttendance
                              : attendance.pendiente
                                ? styles.statusPending
                                : styles.statusAbsence),
                          }}
                        >
                          {attendance.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>Sin historial para el rango seleccionado.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.62)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
    zIndex: 2300,
  },
  modal: {
    width: "100%",
    maxWidth: "980px",
    maxHeight: "calc(100vh - 36px)",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 25px 70px rgba(0, 0, 0, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  badge: {
    display: "inline-flex",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
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
    color: "#475569",
    fontWeight: "700",
  },
  rangeText: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },
  closeButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  reportOverview: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    alignItems: "start",
    marginBottom: "16px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
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
    marginBottom: "6px",
  },
  value: {
    color: "#0f172a",
    fontSize: "25px",
  },
  calendarPanel: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
  },
  historyPanel: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  panelTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    flex: "0 0 10px",
  },
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "14px",
  },
  monthCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px",
  },
  monthTitle: {
    display: "block",
    color: "#0f172a",
    marginBottom: "10px",
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
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "800",
    border: "1px solid transparent",
  },
  attendedDay: {
    background: "#dcfce7",
    color: "#166534",
    borderColor: "#86efac",
  },
  absentDay: {
    background: "#fee2e2",
    color: "#b91c1c",
    borderColor: "#fecaca",
  },
  pendingDay: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderColor: "#93c5fd",
  },
  outsideClassDay: {
    background: "#ffffff",
    color: "#94a3b8",
    borderColor: "#e2e8f0",
  },
  historyCount: {
    color: "#0f172a",
    fontSize: "13px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "460px",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a",
  },
  statusPill: {
    display: "inline-flex",
    minWidth: "105px",
    justifyContent: "center",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  statusAttendance: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusAbsence: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  statusPending: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  emptyState: {
    padding: "18px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "14px",
    fontWeight: "700",
  },
};

export default StudentAttendanceReport;
