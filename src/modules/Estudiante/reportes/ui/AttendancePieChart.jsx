const buildPieSegment = (percentage) =>
  `conic-gradient(#16a34a 0 ${percentage}%, #dc2626 ${percentage}% 100%)`;

const AttendancePieChart = ({ summary }) => {
  const percentage = summary.attendancePercentage || 0;

  return (
    <div className="student-attendance-chart" aria-label={`Asistencia ${percentage}%`}>
      <div
        className="student-attendance-chart__pie"
        style={{ background: buildPieSegment(percentage) }}
      >
        <div className="student-attendance-chart__center">
          <strong>{percentage}%</strong>
          <span>asistencia</span>
        </div>
      </div>

      <div className="student-attendance-chart__legend">
        <span>
          <i className="student-attendance-chart__dot student-attendance-chart__dot--green" />
          Asistencias: {summary.attendedClasses}
        </span>
        <span>
          <i className="student-attendance-chart__dot student-attendance-chart__dot--red" />
          Inasistencias: {summary.missedClasses}
        </span>
      </div>
    </div>
  );
};

export default AttendancePieChart;
