import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/utils/routePaths";
import CoursesSection from "./CoursesSection";

const CoursesView = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>
            <span style={styles.badge}>Modulo cursos</span>
            <h1 style={styles.title}>Gestion de Cursos</h1>
            <p style={styles.subtitle}>
              Valida conflictos por aula, dia y franja horaria antes de guardar.
            </p>
          </div>
        </div>

        <CoursesSection />
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 45%, #ecfeff 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  wrapper: {
    maxWidth: "1280px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    marginBottom: "10px",
    backgroundColor: "#dfebf5",
    color: "#1d4ed8",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    color: "#0f172a",
    fontWeight: "800",
  },
  subtitle: {
    marginTop: "8px",
    color: "#64748b",
    maxWidth: "720px",
    lineHeight: "1.6",
  },
  backButton: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default CoursesView;
