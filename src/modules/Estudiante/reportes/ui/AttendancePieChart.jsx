// Función para generar el gradiente del gráfico
const buildPieSegment = (percentage) =>
  `conic-gradient(#16a34a 0 ${percentage}%, #dc2626 ${percentage}% 100%)`;

const AttendancePieChart = ({ summary }) => {
  // 1. BLINDAJE: Si el summary no existe (mientras carga), evitamos que la app truene
  if (!summary) {
    return <div className="student-attendance-chart">Cargando gráfico...</div>;
  }

  // 2. EXTRACCIÓN DE DATOS: Usamos valores por defecto (0)
  const percentage = summary.attendancePercentage ?? 0;
  const total = summary.totalClasses ?? 0;
  const attended = summary.attendedClasses ?? 0;
  const missed = summary.missedClasses ?? 0;
  const absencePercentage = summary.absencePercentage ?? 0;

  // 3. LÓGICA VISUAL:
  // Si hay clases programadas, mostramos verde/rojo. 
  // Si no hay clases aún (total 0), mostramos un gris neutral.
  const chartStyle = {
    background: total > 0 ? buildPieSegment(percentage) : "#e2e8f0"
  };

  return (
    <div className="student-attendance-chart" aria-label={`Asistencia ${percentage}%`}>
      <div className="student-attendance-chart__pie" style={chartStyle}>
        <div className="student-attendance-chart__center">
          {/* Si hay clases, mostramos el porcentaje (aunque sea 0%) */}
          <strong>{total > 0 ? `${percentage}%` : "--"}</strong>
          <span>asistencia</span>
        </div>
      </div>

      <div className="student-attendance-chart__legend">
        <span>
          <i className="student-attendance-chart__dot student-attendance-chart__dot--green" />
          Asistencias: {attended} ({percentage}%)
        </span>
        <span>
          <i className="student-attendance-chart__dot student-attendance-chart__dot--red" />
          Inasistencias: {missed} ({absencePercentage}%)
        </span>
      </div>
    </div>
  );
};

export default AttendancePieChart;
