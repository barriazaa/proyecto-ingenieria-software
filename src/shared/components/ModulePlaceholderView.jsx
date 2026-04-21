import { useNavigate } from "react-router-dom";

const ModulePlaceholderView = ({
  title,
  description,
  highlights,
  backRoute = "/home",
}) => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.badge}>Modulo en estructura hexagonal</span>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.description}>{description}</p>

        <div style={styles.list}>
          {highlights.map((item) => (
            <div key={item} style={styles.listItem}>
              {item}
            </div>
          ))}
        </div>

        <button type="button" style={styles.button} onClick={() => navigate(backRoute)}>
          Volver
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #eef4ff 0%, #f8fbff 50%, #edf7ff 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  badge: {
    display: "inline-block",
    marginBottom: "16px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "34px",
  },
  description: {
    marginTop: "12px",
    color: "#475569",
    lineHeight: "1.7",
    fontSize: "16px",
  },
  list: {
    marginTop: "24px",
    display: "grid",
    gap: "12px",
  },
  listItem: {
    padding: "14px 16px",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: "600",
  },
  button: {
    marginTop: "28px",
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default ModulePlaceholderView;
