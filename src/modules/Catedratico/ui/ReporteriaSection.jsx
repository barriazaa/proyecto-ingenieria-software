const ReporteriaSection = ({ reporteria }) => {
  return (
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
  );
};

const styles = {
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
};

export default ReporteriaSection;
