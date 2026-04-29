import { useEffect, useState } from "react";
import { getCourses } from "../../cursos/application/courseService";
import { useAuth } from "../../../shared/context/AuthContext";

const normalizeCourseIds = (cursosAsignados = []) =>
  cursosAsignados.map((c) => (typeof c === "string" ? c : c.id || c.courseId)).filter(Boolean);

const StudentView = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = await getCourses();
        const assignedIds = normalizeCourseIds(currentUser?.cursosAsignados);
        setCourses(allCourses.filter((c) => assignedIds.includes(c.id)));
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar tus cursos.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadCourses();
    }
  }, [currentUser]);

  if (loading) {
    return <div style={styles.loading}>Cargando tu informacion...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  const fullName = `${currentUser?.nombres || ""} ${currentUser?.apellidos || ""}`.trim() || "Estudiante";
  const estado = currentUser?.estado || "Activo";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Bienvenido, {fullName}</h1>
            <p style={styles.subtitle}>Panel del estudiante</p>
          </div>
          <span style={{ ...styles.badge, ...(estado === "Activo" ? styles.badgeActive : styles.badgeInactive) }}>
            {estado}
          </span>
        </div>

        <div style={styles.infoGrid}>
          <InfoCard label="Carnet" value={currentUser?.carnet || "Sin carnet"} />
          <InfoCard label="Correo" value={currentUser?.email || currentUser?.correo || "Sin correo"} />
          <InfoCard label="Cursos asignados" value={String(courses.length)} />
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Mis cursos</h2>

          {courses.length === 0 ? (
            <p style={styles.empty}>No tienes cursos asignados todavia.</p>
          ) : (
            <div style={styles.courseGrid}>
              {courses.map((course) => (
                <div key={course.id} style={styles.courseCard}>
                  <span style={styles.courseName}>{course.nombre || "Curso sin nombre"}</span>
                  <div style={styles.courseMeta}>
                    <MetaItem label="Seccion" value={course.seccion || "—"} />
                    <MetaItem label="Horario" value={course.horario || "—"} />
                    <MetaItem
                      label="Dias"
                      value={
                        Array.isArray(course.dias) && course.dias.length > 0
                          ? course.dias.join(", ")
                          : "—"
                      }
                    />
                  </div>
                  <span
                    style={{
                      ...styles.courseStatus,
                      ...(course.estado ? styles.courseStatusActive : styles.courseStatusInactive),
                    }}
                  >
                    {course.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div style={styles.infoCard}>
    <span style={styles.infoLabel}>{label}</span>
    <strong style={styles.infoValue}>{value}</strong>
  </div>
);

const MetaItem = ({ label, value }) => (
  <div style={styles.metaItem}>
    <span style={styles.metaLabel}>{label}:</span>
    <span style={styles.metaValue}>{value}</span>
  </div>
);

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#2196F3",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0,
  },
  subtitle: {
    color: "#eaf4ff",
    margin: "6px 0 0",
    fontSize: "16px",
  },
  badge: {
    padding: "8px 18px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "14px",
  },
  badgeActive: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeInactive: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  infoCard: {
    background: "#06111d",
    border: "1.5px solid #ff9800",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 0 20px rgba(255, 152, 0, 0.2)",
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoValue: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "800",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  panelTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#111827",
    marginTop: 0,
    marginBottom: "20px",
  },
  empty: {
    color: "#64748b",
    textAlign: "center",
    padding: "24px 0",
  },
  courseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  courseCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    background: "#f8fbff",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  courseName: {
    fontWeight: "700",
    fontSize: "17px",
    color: "#0f172a",
  },
  courseMeta: {
    display: "grid",
    gap: "6px",
  },
  metaItem: {
    display: "flex",
    gap: "8px",
    fontSize: "14px",
  },
  metaLabel: {
    color: "#64748b",
    fontWeight: "600",
    minWidth: "60px",
  },
  metaValue: {
    color: "#0f172a",
  },
  courseStatus: {
    display: "inline-flex",
    alignSelf: "flex-start",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  courseStatusActive: {
    background: "#dcfce7",
    color: "#166534",
  },
  courseStatusInactive: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  loading: {
    padding: "40px",
    fontSize: "18px",
    color: "#111827",
    textAlign: "center",
  },
  error: {
    padding: "40px",
    color: "red",
    textAlign: "center",
  },
};

export default StudentView;
