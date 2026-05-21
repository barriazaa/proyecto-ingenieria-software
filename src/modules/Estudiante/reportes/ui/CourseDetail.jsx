import AttendancePieChart from "./AttendancePieChart";

const PercentageBadge = ({ label, value, tone }) => (
  <div className={`student-percentage-badge student-percentage-badge--${tone}`}>
    <span>{label}</span>
    <strong>{value}%</strong>
  </div>
);

const CourseDetail = ({ course, range, summary, onRangeChange, onBack }) => {
  if (!course || !summary) {
    return (
      <section className="student-panel student-page--center">
        <p>Cargando detalles del curso...</p>
      </section>
    );
  }

  const attendanceRows = summary.attendanceRows || [];
  const handleClearRange = () => {
    onRangeChange("startDate", "");
    onRangeChange("endDate", "");
  };

  return (
    <section className="student-panel student-course-detail">
      <button type="button" className="student-back-button" onClick={onBack}>
        Atrás
      </button>

      <div className="student-course-detail__header">
        <div className="student-section-heading">
          <span>Detalle de curso</span>
          <h2>{summary.courseDisplayName || course.nombre}</h2>
        </div>
        <div className="student-course-meta">
          <span>{course.horario || "Horario por definir"}</span>
          <span>{(course.dias || []).join(", ") || "Dias por definir"}</span>
        </div>
      </div>

      <div className="student-date-filter">
        <label className="student-date-field">
          <span>Fecha inicio</span>
          <input
            className="student-date-input"
            type="date"
            value={range.startDate}
            onChange={(event) => onRangeChange("startDate", event.target.value)}
          />
        </label>
        <label className="student-date-field">
          <span>Fecha fin</span>
          <input
            className="student-date-input"
            type="date"
            value={range.endDate}
            onChange={(event) => onRangeChange("endDate", event.target.value)}
          />
        </label>
        <button type="button" className="student-clear-range-button" onClick={handleClearRange}>
          Limpiar filtro
        </button>
      </div>

      <div className="student-attendance-layout">
        <div className="student-attendance-summary">
          <AttendancePieChart summary={summary} />

          <div className="student-stats-grid">
            <div>
              <span>Total clases</span>
              <strong>{summary.totalClasses || 0}</strong>
            </div>
            <div>
              <span>Registradas</span>
              <strong>{summary.attendedClasses || 0}</strong>
            </div>
            <div>
              <span>Pendientes</span>
              <strong>{summary.missedClasses || 0}</strong>
            </div>
          </div>

          <div className="student-percentage-row">
            <PercentageBadge
              label="% asistencia"
              value={summary.attendancePercentage || 0}
              tone="attendance"
            />
            <PercentageBadge
              label="% inasistencia"
              value={summary.absencePercentage || 0}
              tone="absence"
            />
          </div>
        </div>

        <div className="student-attendance-table-card">
          <div className="student-attendance-table-header">
            <span>Historial filtrado</span>
            <strong>{attendanceRows.length} registros</strong>
          </div>
          <div className="student-attendance-table-wrap">
            <table className="student-attendance-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.length > 0 ? (
                  attendanceRows.map((attendance) => (
                    <tr key={attendance.id}>
                      <td>{attendance.fechaLabel}</td>
                      <td>
                        <span className="student-attendance-status">
                          {attendance.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>Sin asistencias en este rango.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseDetail; 
