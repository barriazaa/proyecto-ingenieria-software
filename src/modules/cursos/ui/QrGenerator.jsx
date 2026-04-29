import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { updateCourseToken } from "../application/courseService";

const QrGenerator = ({ course, currentTeacher, onClose }) => {
  const [qrToken, setQrToken] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const generarYGuardarToken = async () => {
    const nuevoToken = Math.random().toString(36).substring(2, 10);
    
    const ahora = new Date();
    const timestamp = ahora.toLocaleTimeString('es-GT', {
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false
    });

    try {
      await updateCourseToken(course, nuevoToken, timestamp);
      setQrToken(nuevoToken);
      setLastUpdated(timestamp);
    } catch (err) {
      console.error("Error crítico al rotar el token en Firebase:", err);
    }
  };

  useEffect(() => {
    generarYGuardarToken();
    const interval = setInterval(() => {
      generarYGuardarToken();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={qrStyles.overlay}>
      <div style={qrStyles.modal}>
        <header style={qrStyles.header}>
          <h2 style={qrStyles.title}>Asistencia: {course.nombre}</h2>
          <p style={qrStyles.subtitle}>Sección {course.seccion} | Aula {course.aula}</p>
        </header>

        <div style={qrStyles.qrWrapper}>
          {qrToken ? (
            <QRCodeSVG 
              value={JSON.stringify({
                i: course.id,
                d: course.teacherUid || currentTeacher?.uid,
                t: qrToken
              })} 
              size={260} 
              level="M" 
              includeMargin={true}
            />
          ) : (
            <div style={qrStyles.loadingBox}>Generando código seguro...</div>
          )}
        </div>

        <div style={qrStyles.footer}>
          <div style={qrStyles.statusBadge}>
            <span style={qrStyles.syncIcon}>🔄</span> 
            Rotación activa (20s)
          </div>
          <p style={qrStyles.timestamp}>
            Última actualización: <strong>{lastUpdated}</strong>
          </p>
        </div>

        <button style={qrStyles.closeButton} onClick={onClose}>
          Finalizar Marcaje
        </button>
      </div>
    </div>
  );
};

const qrStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(6px)",
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "28px",
    padding: "32px",
    textAlign: "center",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "24px",
    fontWeight: "800",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  qrWrapper: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
  },
  loadingBox: {
    height: "260px",
    width: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "14px",
  },
  footer: {
    marginBottom: "28px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#059669",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "12px",
  },
  syncIcon: {
    fontSize: "16px",
  },
  timestamp: {
    margin: 0,
    fontSize: "13px",
    color: "#475569",
  },
  closeButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s ease",
  },
};

export default QrGenerator;