import { useEffect, useState } from "react";
import ReporteriaSection from "./ReporteriaSection";
import EstudiantesTable from "./EstudiantesTable";
import CursosTable from "./CursosTable";

const CatedraticoView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("No se pudieron cargar los datos. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "24px",
      marginBottom: "28px",
    },

    cardWrapper: (isHovered, isActive) => ({
      borderRadius: "28px",
      transition: "all 0.35s ease",
      transform: isHovered || isActive ? "scale(1.02)" : "scale(1)",
      boxShadow:
        isHovered || isActive
          ? "0 0 35px rgba(255, 152, 0, 0.75), 0 0 70px rgba(255, 152, 0, 0.45)"
          : "0 0 25px rgba(255, 152, 0, 0.45), 0 0 50px rgba(255, 152, 0, 0.25)",
      cursor: "pointer",
    }),

    card: {
      backgroundColor: "#06111d",
      borderRadius: "28px",
      padding: "40px 28px",
      border: "1.5px solid #ff9800",
      minHeight: "50px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      textAlign: "center",
    },

    cardHeader: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "14px",
    },

    cardTitle: {
      fontSize: "42px",
      fontWeight: "800",
      color: "#ffffff",
      margin: 0,
      lineHeight: "1.1",
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

  if (loading) {
    return <div style={styles.loading}>Cargando información...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        <h2>Ocurrió un error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Panel del Catedrático</h1>

        <div style={styles.grid}>
          <div
            style={styles.cardWrapper(
              hoveredCard === "cursos",
              activeSection === "cursos"
            )}
            onMouseEnter={() => setHoveredCard("cursos")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setActiveSection("cursos")}
          >
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Cursos</h2>
              </div>
            </div>
          </div>

          <div
            style={styles.cardWrapper(
              hoveredCard === "estudiantes",
              activeSection === "estudiantes"
            )}
            onMouseEnter={() => setHoveredCard("estudiantes")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setActiveSection("estudiantes")}
          >
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Estudiantes</h2>
              </div>
            </div>
          </div>

          <div
            style={styles.cardWrapper(
              hoveredCard === "reporteria",
              activeSection === "reporteria"
            )}
            onMouseEnter={() => setHoveredCard("reporteria")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setActiveSection("reporteria")}
          >
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Reportería</h2>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Funciones disponibles</h2>

          {activeSection === "cursos" && <CursosTable />}
{activeSection === "estudiantes" && <EstudiantesTable />}
{activeSection === "reporteria" && <ReporteriaSection />}
          {!activeSection && (
            <p>Selecciona una card para cargar información aquí.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatedraticoView;