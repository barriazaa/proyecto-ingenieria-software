import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { auth } from "../../../firebase/firebase";
import EstudianteService from "../application/estudianteService";

const QRScannerPanel = () => {
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null); // Guardamos la ubicación aquí
  const qrInstanceRef = useRef(null);

  // 1. Función para obtener la ubicación (se llama al inicio)
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus({ msg: "Tu navegador no soporta GPS.", type: "error" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setStatus({ msg: "", type: "" }); // Limpiamos errores si acepta
      },
      (geoErr) => {
        let errorMsg = "Se requiere GPS para marcar asistencia.";
        if (geoErr.code === 1) errorMsg = "Debes permitir el GPS para usar esta función.";
        setStatus({ msg: errorMsg, type: "error" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onScanSuccess = async (decodedText) => {
    if (loading) return;

    // Si al escanear aún no tenemos coordenadas, reintentamos pedirlas
    if (!userCoords) {
      setStatus({ msg: "Esperando señal de GPS... intenta de nuevo.", type: "error" });
      requestLocation();
      return;
    }

    try {
      setLoading(true);
      if (qrInstanceRef.current) await qrInstanceRef.current.stop();

      const data = JSON.parse(decodedText);
      
      // Procesamos con las coordenadas que ya teníamos guardadas
      const res = await EstudianteService.processAttendanceScan(data, auth.currentUser, userCoords);
      
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
    // Al cargar el componente, disparamos ambos: Cámara y GPS
    requestLocation();
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
          {!userCoords && <p style={{ color: "#e11d48", fontSize: "12px", fontWeight: "bold" }}>⚠️ GPS requerido</p>}
          <p style={{ color: "#64748b", fontSize: "13px" }}>Apunta al código QR del docente</p>
        </div>
      )}
    </section>
  );
};

export default QRScannerPanel;