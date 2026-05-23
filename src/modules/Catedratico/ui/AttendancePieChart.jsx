import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const CHART_COLORS = {
  attendance: "#2563eb",
  absence: "#dc2626",
  empty: "#e2e8f0",
};

const getAttendancePercentage = (report) =>
  report?.porcentajeAsistencia ?? report?.porcentaje ?? 0;

const getAbsencePercentage = (report) => report?.porcentajeInasistencia ?? 0;

const AttendancePieChart = ({ report, title = "Distribucion de asistencia" }) => {
  const totalAsistencias = report?.totalAsistencias || 0;
  const totalInasistencias = report?.totalInasistencias || 0;
  const total = totalAsistencias + totalInasistencias;
  const attendancePercentage = getAttendancePercentage(report);
  const absencePercentage = getAbsencePercentage(report);
  const hasData = total > 0;
  const chartData = hasData
    ? [
        {
          name: "Asistencia",
          value: totalAsistencias,
          percentage: attendancePercentage,
          color: CHART_COLORS.attendance,
        },
        {
          name: "Inasistencia",
          value: totalInasistencias,
          percentage: absencePercentage,
          color: CHART_COLORS.absence,
        },
      ]
    : [
        {
          name: "Sin datos",
          value: 1,
          percentage: 0,
          color: CHART_COLORS.empty,
        },
      ];

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.label}>Grafica pastel</span>
        <h3 style={styles.title}>{title}</h3>
      </div>

      <div style={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={hasData ? 2 : 0}
              isAnimationActive={false}
              stroke="#ffffff"
              strokeWidth={3}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            {hasData ? (
              <Tooltip
                formatter={(value, name, item) => [
                  `${value} (${item.payload.percentage}%)`,
                  name,
                ]}
              />
            ) : null}
          </PieChart>
        </ResponsiveContainer>
        <div style={styles.centerLabel}>
          <strong style={styles.centerValue}>
            {hasData ? `${attendancePercentage}%` : "--"}
          </strong>
          <span style={styles.centerText}>asistencia</span>
        </div>
      </div>

      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <i style={{ ...styles.dot, background: CHART_COLORS.attendance }} />
          Asistencia: {totalAsistencias} ({attendancePercentage}%)
        </span>
        <span style={styles.legendItem}>
          <i style={{ ...styles.dot, background: CHART_COLORS.absence }} />
          Inasistencia: {totalInasistencias} ({absencePercentage}%)
        </span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    background: "#ffffff",
  },
  header: {
    marginBottom: "6px",
  },
  label: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
  },
  chartWrap: {
    position: "relative",
    width: "100%",
    minHeight: "220px",
  },
  centerLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  centerValue: {
    color: "#0f172a",
    fontSize: "28px",
    lineHeight: 1,
  },
  centerText: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    marginTop: "5px",
  },
  legend: {
    display: "grid",
    gap: "8px",
    marginTop: "2px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    flex: "0 0 10px",
  },
};

export default AttendancePieChart;
