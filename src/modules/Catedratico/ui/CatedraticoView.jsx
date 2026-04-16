import { useEffect, useState } from "react";
import CatedraticoService from "../application/CatedraticoService";
import EstudiantesTable from "./EstudiantesTable";
import ReporteriaSection from "./ReporteriaSection";
import CoursesSection from "../../cursos/ui/CoursesSection";

const CatedraticoView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({
    cards: [],
    estudiantes: [],
    reporteria: {
      totalEstudiantes: 0,
      totalCursos: 0,
      cursosActivos: 0,
    },
  });
  const [activeSection, setActiveSection] = useState("estudiantes");

  const sectionTitles = {
    estudiantes: "Estudiantes",
    cursos: "Cursos",
    reporteria: "Reporteria",
  };

  const renderSection = () => {
    switch (activeSection) {
      case "cursos":
        return <CoursesSection />;
      case "reporteria":
        return <ReporteriaSection reporteria={dashboard.reporteria} />;
      case "estudiantes":
      default:
        return <EstudiantesTable estudiantes={dashboard.estudiantes} />;
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await CatedraticoService.getDashboardData();
        setDashboard(data);
      } catch (loadError) {
        console.error(loadError);
        setError("No se pudieron cargar los datos del panel.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Cargando informacion...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Panel del Catedratico</h1>

        <div style={styles.grid}>
          {dashboard.cards.map((card) => (
            <button
              key={card.id}
              type="button"
              style={{ ...styles.card, borderColor: card.accent }}
              onClick={() => setActiveSection(card.id)}
            >
              <span style={{ ...styles.cardValue, color: card.accent }}>{card.value}</span>
              <h2 style={styles.cardTitle}>{card.title}</h2>
              <p style={styles.cardDescription}>{card.description}</p>
              <span style={styles.cardAction}>{card.actionLabel || "Ver detalle"}</span>
            </button>
          ))}
        </div>

        <div id="dynamic-content" style={styles.panel}>
          <h2 style={styles.panelTitle}>{sectionTitles[activeSection] || "Estudiantes"}</h2>
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#2196F3",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1350px",
    margin: "0 auto",
  },
  title: {
    fontSize: "38px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "10px",
    textAlign: "center",
  },
  subtitle: {
    color: "#eaf4ff",
    textAlign: "center",
    marginBottom: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    marginBottom: "28px",
  },
  card: {
    backgroundColor: "#06111d",
    borderRadius: "28px",
    padding: "32px 28px",
    border: "1.5px solid #ff9800",
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(255, 152, 0, 0.25)",
  },
  cardValue: {
    fontSize: "34px",
    fontWeight: "800",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "30px",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0,
  },
  cardDescription: {
    color: "#cbd5e1",
    lineHeight: "1.6",
    marginTop: "12px",
    marginBottom: "16px",
  },
  cardAction: {
    color: "#7dd3fc",
    fontWeight: "700",
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    border: "1px solid #d1d5db",
    minHeight: "250px",
  },
  panelTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "18px",
  },
  loading: {
    padding: "30px",
    fontSize: "18px",
    color: "#111827",
  },
  error: {
    padding: "30px",
    color: "red",
  },
};

export default CatedraticoView;
