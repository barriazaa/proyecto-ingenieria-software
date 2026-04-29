import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { auth } from "../../../firebase/firebase";
import EstudianteService from "../application/estudianteService";

const QRScannerPanel = () => {
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null); 
  const qrInstanceRef = useRef(null);

  // 1. Función para obtener la ubicación (Ahora se activa SOLO si el curso lo pide)
  const requestLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setStatus({ msg: "Tu navegador no soporta GPS.", type: "error" });
        return reject(new Error("No soporta GPS"));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserCoords(coords);
          resolve(coords);
        },
        (geoErr) => {
          let errorMsg = "Se requiere GPS para marcar asistencia en esta clase.";
          if (geoErr.code === 1) errorMsg = "Debes permitir el GPS para esta clase específica.";
          setStatus({ msg: errorMsg, type: "error" });
          reject(new Error(errorMsg));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const onScanSuccess = async (decodedText) => {
    if (loading) return;

    try {
      setLoading(true);
      const data = JSON.parse(decodedText);
      const courseId = data.i;

      // VALIDACIÓN NUEVA: Revisar si el curso requiere GPS antes de pedirlo
      setStatus({ msg: "Validando requisitos de la clase...", type: "info" });
      const { requiereGPS } = await EstudianteService.getCourseRequirements(courseId);

      let currentCoords = userCoords;

      // Si la clase requiere GPS y no lo tenemos, lo pedimos en este momento
      if (requiereGPS && !currentCoords) {
        setStatus({ msg: "Esta clase requiere validación de ubicación. Activando GPS...", type: "info" });
        currentCoords = await requestLocation();
      }

      if (qrInstanceRef.current) await qrInstanceRef.current.stop();
      
      // Procesamos con coordenadas (si fueron requeridas) o sin ellas (si no)
      const res = await EstudianteService.processAttendanceScan(data, auth.currentUser, currentCoords);
      
      setStatus({ msg: res.message, type: "success" });
    } catch (err) {
      setStatus({ msg: err.message || "Error al procesar", type: "error" });
      setLoading(false);
      setTimeout(() => startCamera(), 3000);
    }
  };

  const startCamera = async () => {
    if (qrInstanceRef.current && qrInstanceRef.current.isScanning) {
      await qrInstanceRef.current.stop();
    }

    const html5QrCode = new Html5Qrcode("student-qr-reader");
    qrInstanceRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 15, qrbox: { width: 180, height: 180 } }, 
        onScanSuccess
      );
    } catch (error) {
      console.error(error);
      setStatus({ msg: "Revisa los permisos de cámara.", type: "error" });
    }
  };

  useEffect(() => {
    // CAMBIO PODEROSO: Solo arranca la cámara. El GPS se queda apagado.
    startCamera();

    return () => {
      if (qrInstanceRef.current && qrInstanceRef.current.isScanning) {
        qrInstanceRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <section className="student-panel student-qr-panel">
      <div className="student-section-heading">
        <span>Escaneo QR</span>
        <h2>Marcar asistencia</h2>
      </div>

      {status.msg && (
        <div style={{
          padding: "10px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px", fontWeight: "bold", textAlign: "center",
          backgroundColor: status.type === "success" ? "#dcfce7" : status.type === "error" ? "#fee2e2" : "#dbeafe",
          color: status.type === "success" ? "#166534" : status.type === "error" ? "#991b1b" : "#1e40af"
        }}>
          {status.msg}
        </div>
      )}

      <div style={{
        width: "220px", height: "220px", margin: "0 auto", borderRadius: "16px",
        overflow: "hidden", background: "#000", border: "3px solid #e2e8f0"
      }}>
        <div id="student-qr-reader" style={{ width: "100%", height: "100%" }}></div>
      </div>

      {loading ? (
        <p style={{ color: "#2563eb", fontWeight: "bold", marginTop: "15px", textAlign: "center", fontSize: "14px" }}>
          Procesando asistencia...
        </p>
      ) : (
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Apunta al código QR del docente</p>
          <p style={{ color: "#94a3b8", fontSize: "11px", marginTop: "5px" }}>La ubicación solo se pedirá si el curso lo requiere.</p>
        </div>
      )}
    </section>
  );
};

export default QRScannerPanel;