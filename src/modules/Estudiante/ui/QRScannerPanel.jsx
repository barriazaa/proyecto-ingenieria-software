import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { auth } from "../../../firebase/firebase";
import EstudianteService from "../application/estudianteService";

const QRScannerPanel = () => {
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  
  // Estados para el Zoom
  const [zoomSettings, setZoomSettings] = useState({ min: 1, max: 1, step: 0.1, current: 1 });
  const [hasZoom, setHasZoom] = useState(false);
  
  const qrInstanceRef = useRef(null);

  const requestLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setStatus({ msg: "Tu navegador no soporta GPS.", type: "error" });
        return reject(new Error("No soporta GPS"));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserCoords(coords);
          resolve(coords);
        },
        (geoErr) => {
          let errorMsg = "Se requiere GPS para marcar asistencia.";
          if (geoErr.code === 1) errorMsg = "Debes permitir el GPS.";
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

      setStatus({ msg: "Validando requisitos...", type: "info" });
      
      // Llamada al Service (Asegúrate de haber agregado el puente en EstudianteService.js)
      const requirements = await EstudianteService.getCourseRequirements(courseId);
      
      // Usamos requiereGPS que es el nombre real en tu DB
      const requiereGPS = requirements.requiereGPS;

      let currentCoords = userCoords;

      if (requiereGPS && !currentCoords) {
        setStatus({ msg: "Activando GPS obligatorio...", type: "info" });
        currentCoords = await requestLocation();
      }

      if (qrInstanceRef.current) await qrInstanceRef.current.stop();
      
      const res = await EstudianteService.processAttendanceScan(data, auth.currentUser, currentCoords);
      setStatus({ msg: res.message, type: "success" });
    } catch (err) {
      setStatus({ msg: err.message || "Error al procesar", type: "error" });
      setLoading(false);
      // Reiniciamos la cámara después de 3 segundos para que pueda volver a intentar
      setTimeout(() => startCamera(), 3000);
    }
  };

  const handleZoomChange = async (e) => {
    const zoomValue = parseFloat(e.target.value);
    setZoomSettings(prev => ({ ...prev, current: zoomValue }));
    if (qrInstanceRef.current) {
      try {
        await qrInstanceRef.current.applyVideoConstraints({
          advanced: [{ zoom: zoomValue }]
        });
      } catch (err) {
        console.error("Error aplicando zoom:", err);
      }
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
        { 
          fps: 20, 
          // HACEMOS EL CUADRO DINÁMICO: 90% del ancho disponible para máxima visibilidad
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdgeSize * 0.90),
              height: Math.floor(minEdgeSize * 0.90)
            };
          },
          aspectRatio: 1.0 // Fuerza a que la cámara se vea cuadrada
        }, 
        onScanSuccess
      );

      // Lógica de Zoom
      const videoTrack = html5QrCode.getRunningTrack();
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.zoom) {
        setHasZoom(true);
        setZoomSettings({
          min: capabilities.zoom.min,
          max: capabilities.zoom.max,
          step: capabilities.zoom.step || 0.1,
          current: capabilities.zoom.min
        });
      }
    } catch (error) {
      setStatus({ msg: "Error de cámara. Verifica los permisos.", type: "error" });
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (qrInstanceRef.current?.isScanning) {
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
          padding: "12px", borderRadius: "12px", marginBottom: "15px", fontSize: "13px", fontWeight: "bold", textAlign: "center",
          backgroundColor: status.type === "success" ? "#dcfce7" : status.type === "error" ? "#fee2e2" : "#dbeafe",
          color: status.type === "success" ? "#166534" : status.type === "error" ? "#991b1b" : "#1e40af",
          border: `1px solid ${status.type === "success" ? "#86efac" : status.type === "error" ? "#fecaca" : "#bfdbfe"}`
        }}>
          {status.msg}
        </div>
      )}

      {/* CONTENEDOR MAXIMIZADO: 95% de ancho y hasta 500px para leer el pizarrón */}
      <div style={{
        width: "95%", 
        maxWidth: "500px", 
        aspectRatio: "1 / 1", 
        margin: "0 auto", 
        borderRadius: "24px",
        overflow: "hidden", 
        background: "#000", 
        border: "4px solid #f1f5f9",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", 
        position: "relative"
      }}>
        <div id="student-qr-reader" style={{ width: "100%", height: "100%" }}></div>
      </div>

      {/* CONTROL DE ZOOM MEJORADO CON CLASE CSS Y STOPPROPAGATION */}
      {hasZoom && !loading && (
        <div style={{ width: "100%", maxWidth: "300px", margin: "20px auto 0", textAlign: "center" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "5px", fontWeight: "600" }}>
            Zoom: {zoomSettings.current.toFixed(1)}x
          </label>
          <input
            type="range"
            className="zoom-slider"
            min={zoomSettings.min}
            max={zoomSettings.max}
            step={zoomSettings.step}
            value={zoomSettings.current}
            onChange={handleZoomChange}
            onPointerDown={(e) => e.stopPropagation()} 
            style={{ width: "100%", cursor: "pointer", accentColor: "#2563eb" }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 10px" }}></div>
          <p style={{ color: "#2563eb", fontWeight: "bold", fontSize: "14px" }}>Procesando...</p>
        </div>
      ) : (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ color: "#475569", fontSize: "14px", fontWeight: "500" }}>Enfoca el código QR</p>
          <p style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px" }}>
            {hasZoom ? "Usa la barra para acercar la imagen" : "La ubicación es opcional según el curso"}
          </p>
        </div>
      )}
    </section>
  );
};

export default QRScannerPanel;