import AttendancePieChart from "./AttendancePieChart"; 

const CourseDetail = ({ course, range, summary, onRangeChange, onBack }) => {
  // 1. BLINDAJE DE SEGURIDAD: 
  // Si no hay curso o resumen (mientras carga), mostramos un mensaje amigable
  if (!course || !summary) {
    return (
      <section className="student-panel student-page--center">
        <p>Cargando detalles del curso...</p>
      </section>
    );
  }

  return (
    <section className="student-panel student-course-detail">
      {/* Botón mejorado visualmente */}
      <button type="button" className="student-back-button" onClick={onBack}>
        ← Volver a cursos
      </button>

      <div className="student-course-detail__header">
        <div className="student-section-heading">
          <span>Detalle de curso</span>
          {/* CAMBIO CLAVE: Usamos el nombre profesional generado por el Service/Domain */}
          <h2>{summary.courseDisplayName || course.nombre}</h2>
        </div>
        <div className="student-course-meta">
          <span>{course.horario || "Horario por definir"}</span>
          <span>{(course.dias || []).join(", ") || "Días por definir"}</span>
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
      </div>

      <div className="student-attendance-summary">
        {/* Pasamos el summary al gráfico */}
        <AttendancePieChart summary={summary} />

        <div className="student-stats-grid">
          <div>
            <span>Total clases</span>
            {/* Usamos || 0 para evitar errores si el dato tarda en llegar */}
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
      </div>
    </section>
  );
};

export default CourseDetail;