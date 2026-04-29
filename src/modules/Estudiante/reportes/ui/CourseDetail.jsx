import AttendancePieChart from "./AttendancePieChart"; 

const CourseDetail = ({ course, range, summary, onRangeChange, onBack }) => {
  return (
    <section className="student-panel student-course-detail">
      <button type="button" className="student-back-button" onClick={onBack}>
        Volver a cursos
      </button>

      <div className="student-course-detail__header">
        <div className="student-section-heading">
          <span>Detalle de curso</span>
          <h2>{course.nombre}</h2>
        </div>
        <div className="student-course-meta">
          <span>{course.horario || "Horario por definir"}</span>
          <span>{(course.dias || []).join(", ") || "Dias por definir"}</span>
        </div>
      </div>

      {/* 🔽 Ajuste aquí */}
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
      </div>

      <div className="student-attendance-summary">
        <AttendancePieChart summary={summary} />

        <div className="student-stats-grid">
          <div>
            <span>Total clases</span>
            <strong>{summary.totalClasses}</strong>
          </div>
          <div>
            <span>Registradas</span>
            <strong>{summary.attendedClasses}</strong>
          </div>
          <div>
            <span>Pendientes</span>
            <strong>{summary.missedClasses}</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseDetail;