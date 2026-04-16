import React from "react";
import { useNavigate } from "react-router-dom";

const Catedratico = () => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "📊",
      title: "Reportería",
      description:
        "Consulta informes, métricas y resumen general del sistema académico.",
      button: "Ver reportería",
      route: "/reporteria",
    },
    {
      icon: "🎓",
      title: "Estudiantes",
      description:
        "Visualiza el listado de estudiantes y administra su información.",
      button: "Ver estudiantes",
      route: "/estudiantes",
    },
    {
      icon: "📚",
      title: "Cursos",
      description:
        "Consulta, agrega y modifica los cursos asignados al catedrático.",
      button: "Gestionar cursos",
      route: "/cursos",
    },
  ];

  const funciones = [
    "Consultar reportería académica",
    "Ver listado de estudiantes",
    "Actualizar información de estudiantes",
    "Consultar cursos asignados",
    "Agregar nuevos cursos",
    "Modificar cursos existentes",
  ];

  const stats = [
    { value: "3", label: "Módulos activos" },
    { value: "6", label: "Funciones disponibles" },
    { value: "100%", label: "Panel operativo" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <span style={styles.overline}>Panel académico</span>
            <h1 style={styles.title}>Vista Catedrático</h1>
            <p style={styles.subtitle}>
              Panel principal para la gestión académica del catedrático.
            </p>
          </div>

          <div style={styles.badge}>
            <span style={styles.badgeDot}></span>
            Panel activo
          </div>
        </div>

        <div style={styles.statsGrid}>
          {stats.map((item, index) => (
            <div key={index} style={styles.statTopCard}>
              <div style={styles.statTopValue}>{item.value}</div>
              <div style={styles.statTopLabel}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.cardsGrid}>
          {cards.map((card, index) => (
            <div
              key={index}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 22px 45px rgba(15, 23, 42, 0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 12px 30px rgba(15, 23, 42, 0.08)";
              }}
            >
              <div style={styles.cardIcon}>{card.icon}</div>
              <h2 style={styles.cardTitle}>{card.title}</h2>
              <p style={styles.cardText}>{card.description}</p>
              <button
                style={styles.primaryButton}
                onClick={() => navigate(card.route)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 24px rgba(37, 99, 235, 0.28)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 20px rgba(37, 99, 235, 0.18)";
                }}
              >
                {card.button}
              </button>
            </div>
          ))}
        </div>

        <div style={styles.bottomSection}>
          <div style={styles.infoCard}>
            <h3 style={styles.sectionTitle}>Funciones disponibles</h3>
            <ul style={styles.list}>
              {funciones.map((item, index) => (
                <li key={index} style={styles.listItem}>
                  <span style={styles.listBullet}></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={styles.summaryCard}>
            <h3 style={styles.sectionTitleDark}>Resumen general</h3>
            <p style={styles.summaryText}>
              Desde este panel podrás administrar los módulos principales del
              sistema. La vista está diseñada para centralizar la navegación y
              permitir un acceso rápido, claro y ordenado a las funciones
              académicas más importantes.
            </p>

            <div style={styles.summaryStats}>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>3</span>
                <span style={styles.statLabel}>Módulos</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>6</span>
                <span style={styles.statLabel}>Funciones</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>1</span>
                <span style={styles.statLabel}>Panel central</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef4ff 0%, #f8fbff 50%, #edf7ff 100%)",
    padding: "36px 22px",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
  },
  overline: {
    display: "inline-block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#2563eb",
    backgroundColor: "#dbeafe",
    padding: "6px 12px",
    borderRadius: "999px",
    marginBottom: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.8px",
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "17px",
    color: "#475569",
    lineHeight: "1.6",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#ffffff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    padding: "12px 18px",
    borderRadius: "999px",
    fontWeight: "700",
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05)",
  },
  badgeDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  statTopCard: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "20px 22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  statTopValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "6px",
  },
  statTopLabel: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "22px",
    marginBottom: "28px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
  },
  cardIcon: {
    width: "62px",
    height: "62px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "26px",
    color: "#0f172a",
    fontWeight: "800",
  },
  cardText: {
    marginTop: "12px",
    marginBottom: "22px",
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#475569",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.25s ease",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.18)",
  },
  bottomSection: {
    display: "grid",
    gridTemplateColumns: "1.15fr 1fr",
    gap: "22px",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
  },
  summaryCard: {
    background: "linear-gradient(135deg, #0f172a, #16213a)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 16px 38px rgba(15, 23, 42, 0.18)",
    color: "#ffffff",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionTitleDark: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "28px",
    fontWeight: "800",
    color: "#ffffff",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "16px",
    color: "#334155",
    marginBottom: "14px",
    fontWeight: "500",
  },
  listBullet: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    display: "inline-block",
  },
  summaryText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#cbd5e1",
    marginBottom: "24px",
  },
  summaryStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },
  statBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "18px",
    padding: "18px 14px",
    textAlign: "center",
  },
  statNumber: {
    display: "block",
    fontSize: "28px",
    fontWeight: "800",
    color: "#ffffff",
  },
  statLabel: {
    display: "block",
    marginTop: "8px",
    fontSize: "13px",
    color: "#cbd5e1",
  },
};

export default Catedratico;