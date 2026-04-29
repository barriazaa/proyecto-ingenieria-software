import { useEffect, useRef, useState } from "react";

const QRScannerPanel = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setCameraError("");

      if (cameraActive) {
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("La camara no esta disponible en este navegador.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (error) {
      console.error(error);
      stopCamera();
      setCameraActive(false);
      setCameraError("No se pudo activar la camara del dispositivo.");
    }
  };

  return (
    <section className="student-panel student-qr-panel">
      <div className="student-section-heading">
        <span>Escaneo QR</span>
        <h2>Marcar asistencia</h2>
      </div>

      <div className="student-camera-frame">
        <video
          ref={videoRef}
          className={`student-camera-video ${cameraActive ? "is-active" : ""}`}
          autoPlay
          muted
          playsInline
        />
        {!cameraActive && (
          <div className="student-camera-placeholder">
            <span className="student-camera-icon">QR</span>
            <p>Camara lista para escanear el codigo del curso.</p>
          </div>
        )}
      </div>

      {cameraError ? <div className="student-inline-error">{cameraError}</div> : null}

      <button type="button" className="student-primary-button" onClick={startCamera}>
        {cameraActive ? "Camara activa" : "Marcar asistencia"}
      </button>
    </section>
  );
};

export default QRScannerPanel;
