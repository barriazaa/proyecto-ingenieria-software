import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { auth } from "../../../firebase/firebase";
import EstudianteService from "../application/estudianteService";

const QRScannerPanel = ({ onSuccessComplete }) => {
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // --- NUEVOS ESTADOS: Control de múltiples cámaras ---
  const [cameras, setCameras] = useState([]);
  const [currentCamIndex, setCurrentCamIndex] = useState(-1);

  const [zoomSettings, setZoomSettings] = useState({ min: 1, max: 1, step: 0.1, current: 1 });
  const [hasZoom, setHasZoom] = useState(false);
  
  const qrInstanceRef = useRef(null);
  const isPausedRef = useRef(false);

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
    if (loading || isPausedRef.current || scanSuccess) return;
    
    try {
      setLoading(true);
      isPausedRef.current = true; 
      
      const data = JSON.parse(decodedText);
      const courseId = data.i;

      setStatus({ msg: "Validando requisitos...", type: "info" });
      
      const requirements = await EstudianteService.getCourseRequirements(courseId);
      const requiereGPS = requirements.requiereGPS;

      let currentCoords = userCoords;

      if (requiereGPS && !currentCoords) {
        setStatus({ msg: "Activando GPS obligatorio...", type: "info" });
        currentCoords = await requestLocation();
      }

      if (qrInstanceRef.current && qrInstanceRef.current.isScanning) {
        await qrInstanceRef.current.stop();
      }
      
      const res = await EstudianteService.processAttendanceScan(data, auth.currentUser, currentCoords);
      
      setLoading(false);
      setScanSuccess(true);
      setStatus({ msg: "¡Tu asignación fue marcada exitosamente!", type: "success" });
      
    } catch (err) {
      setLoading(false);
      setStatus({ msg: err.message || "Error al procesar. Espera 10 segundos.", type: "error" });
      
      if (qrInstanceRef.current && qrInstanceRef.current.isScanning) {
          qrInstanceRef.current.pause(true); 
      }

      setTimeout(() => {
        isPausedRef.current = false;
        setStatus({ msg: "", type: "" }); 
        if (qrInstanceRef.current && !qrInstanceRef.current.isScanning && !scanSuccess) {
           // Usamos la cámara actual seleccionada si hay error
           startCamera(currentCamIndex >= 0 ? cameras[currentCamIndex].id : null); 
        } else if (qrInstanceRef.current) {
           qrInstanceRef.current.resume(); 
        }
      }, 10000);
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

  const checkZoomCapabilities = (attempts = 0) => {
    if (!qrInstanceRef.current) return;
    try {
      const videoTrack = qrInstanceRef.current.getRunningTrack();
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        
        if (capabilities.zoom) {
          setHasZoom(true);
          setZoomSettings({
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step || 0.1,
            current: capabilities.zoom.min
          });
          return; 
        }
      }
    } catch (e) {
      // Ignoramos el error silenciosamente
    }

    if (attempts < 5) {
      setTimeout(() => checkZoomCapabilities(attempts + 1), 1000); 
    }
  };

  // --- START CAMERA MODIFICADO PARA ACEPTAR ID ---
  const startCamera = async (specificCameraId = null) => {
    if (qrInstanceRef.current && qrInstanceRef.current.isScanning) {
      await qrInstanceRef.current.stop();
    }

    // Ocultamos el zoom al cambiar de lente, por si el nuevo no tiene
    setHasZoom(false); 

    const html5QrCode = new Html5Qrcode("student-qr-reader");
    qrInstanceRef.current = html5QrCode;
    isPausedRef.current = false;

    try {
      const cameraConfig = specificCameraId 
        ? { deviceId: { exact: specificCameraId } } 
        : { facingMode: "environment" };

      await html5QrCode.start(
        cameraConfig, 
        { 
          fps: 10, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdgeSize * 0.90),
              height: Math.floor(minEdgeSize * 0.90)
            };
          }
        }, 
        onScanSuccess,
        () => {}
      );

      setStatus({ msg: "", type: "" });
      
      checkZoomCapabilities(0);

    } catch (error) {
      console.error(error);
      setStatus({ msg: "Error de cámara. Verifica los permisos de tu navegador.", type: "error" });
    }
  };

  // --- FUNCIÓN DE SALTO DE CÁMARA ---
  const handleSwitchCamera = () => {
    if (cameras.length === 0) return;
    
    let nextIndex = currentCamIndex + 1;
    if (nextIndex >= cameras.length) {
      nextIndex = 0; 
    }
    
    setCurrentCamIndex(nextIndex);
    const nextCamId = cameras[nextIndex].id;
    
    setStatus({ msg: "Cambiando de lente...", type: "info" });
    startCamera(nextCamId);
  };

  useEffect(() => {
    // Obtenemos las cámaras antes de iniciar
    const initCamerasAndStart = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 1) {
          setCameras(devices);
        }
      } catch (err) {
        console.warn("No se pudo obtener la lista de cámaras:", err);
      }
      startCamera();
    };

    initCamerasAndStart();

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
          padding: "16px", borderRadius: "12px", marginBottom: "15px", fontSize: "14px", fontWeight: "bold", textAlign: "center",
          backgroundColor: status.type === "success" ? "#dcfce7" : status.type === "error" ? "#fee2e2" : "#dbeafe",
          color: status.type === "success" ? "#166534" : status.type === "error" ? "#991b1b" : "#1e40af",
          border: `2px solid ${status.type === "success" ? "#86efac" : status.type === "error" ? "#fecaca" : "#bfdbfe"}`
        }}>
          {status.msg}
        </div>
      )}

      {scanSuccess ? (
        <div style={{ textAlign: "center", padding: "30px 10px" }}>
           <button 
             onClick={onSuccessComplete}
             style={{
               background: "#16a34a", color: "white", padding: "14px 28px", borderRadius: "12px",
               border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer",
               boxShadow: "0 4px 6px rgba(22, 163, 74, 0.3)"
             }}
           >
             Aceptar
           </button>
        </div>
      ) : (
        <>
          <div style={{
            width: "95%", maxWidth: "500px", aspectRatio: "1 / 1", margin: "0 auto", 
            borderRadius: "24px", overflow: "hidden", background: "#000", 
            border: "4px solid #f1f5f9", position: "relative"
          }}>
            <div id="student-qr-reader" style={{ width: "100%", height: "100%" }}></div>
          </div>

          {hasZoom && !loading && (
            <div style={{ width: "100%", maxWidth: "300px", margin: "20px auto 0", textAlign: "center" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "5px", fontWeight: "600" }}>
                Zoom: {zoomSettings.current.toFixed(1)}x
              </label>
              <input
                type="range"
                className="zoom-slider"
                min={zoomSettings.min} max={zoomSettings.max} step={zoomSettings.step}
                value={zoomSettings.current} onChange={handleZoomChange}
                onPointerDown={(e) => e.stopPropagation()} 
                style={{ width: "100%", cursor: "pointer", accentColor: "#2563eb" }}
              />
            </div>
          )}

          {/* BOTÓN DE CAMBIO DE CÁMARA */}
          {cameras.length > 1 && !loading && (
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button 
                onClick={handleSwitchCamera}
                style={{
                  background: "#eff6ff", color: "#2563eb", border: "2px solid #bfdbfe",
                  padding: "10px 20px", borderRadius: "12px", fontWeight: "bold",
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              >
                🔄 Cambiar lente ({currentCamIndex + 1 === 0 ? "Auto" : currentCamIndex + 1}/{cameras.length})
              </button>
            </div>
          )}
        </>
      )}

      {loading && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 10px" }}></div>
          <p style={{ color: "#2563eb", fontWeight: "bold", fontSize: "14px" }}>Procesando...</p>
        </div>
      )}
    </section>
  );
};

export default QRScannerPanel;