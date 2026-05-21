import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { auth } from "../../../firebase/firebase";
import EstudianteService from "../application/estudianteService";

const DEFAULT_ZOOM_SETTINGS = { min: 1, max: 1, step: 0.1, current: 1 };
const FALLBACK_ZOOM_SETTINGS = { min: 1, max: 3, step: 0.1, current: 1 };
const ZOOM_CAPABILITY_RETRY_LIMIT = 5;
const ZOOM_CAPABILITY_RETRY_DELAY = 1000;
const ZOOM_APPLY_TOLERANCE = 0.08;
const SCANNER_ELEMENT_ID = "student-qr-reader";

const REAR_CAMERA_KEYWORDS = [
  "back",
  "rear",
  "environment",
  "trasera",
  "posterior",
  "principal"
];

const MAIN_CAMERA_KEYWORDS = [
  "main",
  "principal",
  "standard",
  "camera 0",
  "camara 0",
  "back camera 0"
];

const BAD_CAMERA_KEYWORDS = [
  "front",
  "user",
  "selfie",
  "frontal",
  "ultra wide",
  "ultrawide",
  "ultra-wide",
  "0.5",
  "macro",
  "depth",
  "profundidad",
  "telephoto",
  "tele",
  "periscope"
];

const cameraLabelHasAny = (label, keywords) =>
  keywords.some((keyword) => label.includes(keyword));

const scoreCameraDevice = (device, index) => {
  const label = (device.label || "").toLowerCase();
  let score = 0;

  if (cameraLabelHasAny(label, REAR_CAMERA_KEYWORDS)) score += 120;
  if (cameraLabelHasAny(label, MAIN_CAMERA_KEYWORDS)) score += 35;
  if (cameraLabelHasAny(label, BAD_CAMERA_KEYWORDS)) score -= 180;
  if (!label) score += index;

  score -= index * 2;
  return score;
};

const QRScannerPanel = ({ onSuccessComplete }) => {
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [zoomSettings, setZoomSettings] = useState(FALLBACK_ZOOM_SETTINGS);
  const [hasZoom, setHasZoom] = useState(true);

  const qrInstanceRef = useRef(null);
  const isPausedRef = useRef(false);
  const zoomTrackRef = useRef(null);
  const zoomRetryRef = useRef(null);
  const supportsNativeZoomRef = useRef(false);
  const selectedCameraRef = useRef(null);
  const isMountedRef = useRef(false);
  const scanSuccessRef = useRef(false);
  const cameraStartSessionRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const visualZoomEnabledRef = useRef(false);
  const zoomValueRef = useRef(DEFAULT_ZOOM_SETTINGS.current);

  const safeSetStatus = (nextStatus) => {
    if (isMountedRef.current) setStatus(nextStatus);
  };

  const safeSetZoomState = (_available, settings = FALLBACK_ZOOM_SETTINGS) => {
    if (!isMountedRef.current) return;
    zoomValueRef.current = settings.current;
    setHasZoom(true);
    setZoomSettings(settings);
  };

  const requestLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        safeSetStatus({ msg: "Tu navegador no soporta GPS.", type: "error" });
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
          safeSetStatus({ msg: errorMsg, type: "error" });
          reject(new Error(errorMsg));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const clearZoomRetry = () => {
    if (zoomRetryRef.current) {
      clearTimeout(zoomRetryRef.current);
      zoomRetryRef.current = null;
    }
  };

  const resetZoomControls = () => {
    clearZoomRetry();
    zoomTrackRef.current = null;
    supportsNativeZoomRef.current = false;
    visualZoomEnabledRef.current = false;
    zoomValueRef.current = DEFAULT_ZOOM_SETTINGS.current;
    resetPreviewZoom();
    safeSetZoomState(true, FALLBACK_ZOOM_SETTINGS);
  };

  const resetPreviewZoom = () => {
    const videoElement = document.querySelector(`#${SCANNER_ELEMENT_ID} video`);
    if (!videoElement) return;

    videoElement.style.setProperty("transform", "none", "important");
    videoElement.style.setProperty("transform-origin", "center center");
    videoElement.style.setProperty("transition", "transform 140ms ease-out");
  };

  const applyPreviewZoom = (value) => {
    const videoElement = document.querySelector(`#${SCANNER_ELEMENT_ID} video`);
    if (!videoElement) return;

    const fallbackZoom = Math.min(Math.max(Number(value) || 1, FALLBACK_ZOOM_SETTINGS.min), FALLBACK_ZOOM_SETTINGS.max);
    const transformValue = fallbackZoom > 1 ? `scale(${fallbackZoom})` : "none";

    videoElement.style.setProperty("transform", transformValue, "important");
    videoElement.style.setProperty("transform-origin", "center center");
    videoElement.style.setProperty("transition", "transform 140ms ease-out");
  };

  const getRunningVideoTrack = () => {
    try {
      const videoElement = document.querySelector(`#${SCANNER_ELEMENT_ID} video`);
      const stream = videoElement?.srcObject;
      return stream instanceof MediaStream ? stream.getVideoTracks()[0] || null : null;
    } catch {
      return null;
    }
  };

  const stopScanner = async () => {
    clearZoomRetry();

    const scanner = qrInstanceRef.current;
    if (!scanner) {
      resetZoomControls();
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn("No se pudo detener el scanner:", err);
    }

    try {
      scanner.clear();
    } catch {
      // clear() can fail when the camera never reached the video-ready state.
    }

    if (qrInstanceRef.current === scanner) {
      qrInstanceRef.current = null;
    }

    cameraReadyRef.current = false;
    resetZoomControls();
  };

  const onScanSuccess = async (decodedText) => {
    if (loading || isPausedRef.current || scanSuccessRef.current) return;

    try {
      setLoading(true);
      isPausedRef.current = true;

      const data = JSON.parse(decodedText);
      const courseId = data.i;

      safeSetStatus({ msg: "Validando requisitos...", type: "info" });

      const requirements = await EstudianteService.getCourseRequirements(courseId);
      const requiereGPS = requirements.requiereGPS;

      let currentCoords = userCoords;

      if (requiereGPS && !currentCoords) {
        safeSetStatus({ msg: "Activando GPS obligatorio...", type: "info" });
        currentCoords = await requestLocation();
      }

      await stopScanner();
      await EstudianteService.processAttendanceScan(data, auth.currentUser, currentCoords);

      if (!isMountedRef.current) return;

      setLoading(false);
      scanSuccessRef.current = true;
      setScanSuccess(true);
      setStatus({ msg: "Tu asistencia fue marcada exitosamente.", type: "success" });
    } catch (err) {
      if (!isMountedRef.current) return;

      setLoading(false);
      setStatus({ msg: err.message || "Error al procesar. Espera 10 segundos.", type: "error" });

      if (qrInstanceRef.current?.isScanning) {
        qrInstanceRef.current.pause(true);
      }

      setTimeout(() => {
        if (!isMountedRef.current || scanSuccessRef.current) return;

        isPausedRef.current = false;
        setStatus({ msg: "", type: "" });

        if (qrInstanceRef.current && !qrInstanceRef.current.isScanning) {
          startCamera();
        } else if (qrInstanceRef.current) {
          qrInstanceRef.current.resume();
        }
      }, 10000);
    }
  };

  const clampZoomValue = (value, settings = zoomSettings) => {
    const rawValue = Number(value);
    if (!Number.isFinite(rawValue)) return settings.current;

    const min = Number(settings.min);
    const max = Number(settings.max);
    const step = Number(settings.step) > 0 ? Number(settings.step) : 0.1;
    const clamped = Math.min(Math.max(rawValue, min), max);
    const stepped = min + Math.round((clamped - min) / step) * step;

    return Number(Math.min(Math.max(stepped, min), max).toFixed(3));
  };

  const buildZoomSettings = (capabilities, settings = {}) => {
    const zoomCapability = capabilities?.zoom;
    if (
      !zoomCapability ||
      !Number.isFinite(zoomCapability.min) ||
      !Number.isFinite(zoomCapability.max) ||
      zoomCapability.max <= zoomCapability.min
    ) {
      return null;
    }

    const step = Number.isFinite(zoomCapability.step) && zoomCapability.step > 0 ? zoomCapability.step : 0.1;
    const current = Number.isFinite(settings.zoom) ? settings.zoom : zoomCapability.min;

    return {
      min: zoomCapability.min,
      max: zoomCapability.max,
      step,
      current: clampZoomValue(current, {
        min: zoomCapability.min,
        max: zoomCapability.max,
        step,
        current: zoomCapability.min
      })
    };
  };

  const getZoomSettingsFromScanner = () => {
    try {
      const scanner = qrInstanceRef.current;
      if (!scanner?.isScanning) return null;

      const capabilities = scanner.getRunningTrackCapabilities?.();
      const settings = scanner.getRunningTrackSettings?.() || {};
      return buildZoomSettings(capabilities, settings);
    } catch {
      return null;
    }
  };

  const getZoomSettingsFromCameraCapabilities = () => {
    try {
      const scanner = qrInstanceRef.current;
      if (!scanner?.isScanning) return null;

      const zoomFeature = scanner.getRunningTrackCameraCapabilities?.().zoomFeature?.();
      if (!zoomFeature?.isSupported?.()) return null;

      const min = zoomFeature.min();
      const max = zoomFeature.max();
      const step = Number(zoomFeature.step()) > 0 ? zoomFeature.step() : 0.1;
      const current = Number(zoomFeature.value?.()) || min;

      return {
        min,
        max,
        step,
        current: clampZoomValue(current, { min, max, step, current: min })
      };
    } catch {
      return null;
    }
  };

  const getZoomSettingsFromTrack = (track) => {
    if (!track || typeof track.getCapabilities !== "function" || typeof track.applyConstraints !== "function") {
      return null;
    }

    const capabilities = track.getCapabilities();
    const settings = typeof track.getSettings === "function" ? track.getSettings() : {};
    return buildZoomSettings(capabilities, settings);
  };

  const getCurrentNativeZoomValue = () => {
    try {
      const scannerZoom = qrInstanceRef.current?.getRunningTrackSettings?.()?.zoom;
      if (Number.isFinite(scannerZoom)) return Number(scannerZoom);
    } catch {
      // Ignore and try the video track directly.
    }

    try {
      const trackZoom = getRunningVideoTrack()?.getSettings?.()?.zoom;
      if (Number.isFinite(trackZoom)) return Number(trackZoom);
    } catch {
      // Some browsers do not expose zoom in getSettings().
    }

    return null;
  };

  const didNativeZoomApply = (targetZoom) => {
    const nativeZoom = getCurrentNativeZoomValue();
    if (!Number.isFinite(nativeZoom)) return false;

    return Math.abs(nativeZoom - targetZoom) <= ZOOM_APPLY_TOLERANCE;
  };

  const tryApplyTrackZoom = async (track, zoomValue) => {
    if (!track || typeof track.applyConstraints !== "function") return false;

    const zoomConstraints = [
      { advanced: [{ zoom: zoomValue }] },
      { zoom: zoomValue }
    ];

    for (const constraints of zoomConstraints) {
      try {
        await track.applyConstraints(constraints);
        return true;
      } catch (err) {
        console.warn("Intento de zoom directo fallido:", err);
      }
    }

    return false;
  };

  const tryApplyScannerZoom = async (zoomValue) => {
    try {
      const zoomFeature = qrInstanceRef.current
        ?.getRunningTrackCameraCapabilities?.()
        ?.zoomFeature?.();

      if (zoomFeature?.isSupported?.()) {
        await zoomFeature.apply(zoomValue);
        return true;
      }
    } catch (err) {
      console.warn("Zoom por CameraCapabilities no disponible:", err);
    }

    const scannerConstraints = [
      { advanced: [{ zoom: zoomValue }] },
      { zoom: zoomValue }
    ];

    for (const constraints of scannerConstraints) {
      try {
        await qrInstanceRef.current?.applyVideoConstraints?.(constraints);
        return true;
      } catch (err) {
        console.warn("Zoom por applyVideoConstraints fallido:", err);
      }
    }

    return false;
  };

  const applyCameraZoom = async (value) => {
    const nextZoom = clampZoomValue(value);
    zoomValueRef.current = nextZoom;
    setZoomSettings((prev) => ({ ...prev, current: nextZoom }));

    const videoTrack = zoomTrackRef.current || getRunningVideoTrack();
    const appliedTrackZoom = await tryApplyTrackZoom(videoTrack, nextZoom);
    if (appliedTrackZoom && didNativeZoomApply(nextZoom)) {
      supportsNativeZoomRef.current = true;
      visualZoomEnabledRef.current = false;
      resetPreviewZoom();
      return;
    }

    const appliedScannerZoom = await tryApplyScannerZoom(nextZoom);
    if (appliedScannerZoom && didNativeZoomApply(nextZoom)) {
      supportsNativeZoomRef.current = true;
      visualZoomEnabledRef.current = false;
      resetPreviewZoom();
      return;
    }

    supportsNativeZoomRef.current = false;
    visualZoomEnabledRef.current = true;
    applyPreviewZoom(nextZoom);
  };

  const handleZoomChange = (e) => {
    applyCameraZoom(e.target.value);
  };

  const handleZoomStep = (direction) => {
    applyCameraZoom(zoomSettings.current + zoomSettings.step * direction);
  };

  const checkZoomCapabilities = (attempts = 0) => {
    clearZoomRetry();

    const videoTrack = getRunningVideoTrack();
    const detectedZoomSettings =
      getZoomSettingsFromScanner() ||
      getZoomSettingsFromCameraCapabilities() ||
      getZoomSettingsFromTrack(videoTrack);

    if (detectedZoomSettings) {
      const shouldKeepCurrentZoom = zoomValueRef.current > DEFAULT_ZOOM_SETTINGS.current;
      const nextZoomSettings = shouldKeepCurrentZoom
        ? { ...detectedZoomSettings, current: clampZoomValue(zoomValueRef.current, detectedZoomSettings) }
        : detectedZoomSettings;

      zoomTrackRef.current = videoTrack;
      supportsNativeZoomRef.current = true;
      safeSetZoomState(true, nextZoomSettings);

      if (visualZoomEnabledRef.current && shouldKeepCurrentZoom) {
        applyPreviewZoom(nextZoomSettings.current);
      } else {
        resetPreviewZoom();
      }
      return;
    }

    zoomTrackRef.current = null;
    supportsNativeZoomRef.current = false;
    if (attempts === 0) {
      safeSetZoomState(true, FALLBACK_ZOOM_SETTINGS);
    }

    if (attempts < ZOOM_CAPABILITY_RETRY_LIMIT) {
      zoomRetryRef.current = setTimeout(
        () => checkZoomCapabilities(attempts + 1),
        ZOOM_CAPABILITY_RETRY_DELAY
      );
    }
  };

  const getVideoInputs = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  };

  const getPreferredCamera = async () => {
    const videoInputs = await getVideoInputs();
    if (!videoInputs.length) return null;

    const hasDeviceLabels = videoInputs.some((device) => device.label);
    if (!hasDeviceLabels) return null;

    return videoInputs
      .map((device, index) => ({ device, score: scoreCameraDevice(device, index) }))
      .sort((a, b) => b.score - a.score)[0].device;
  };

  const buildCameraStartCandidates = async () => {
    const preferredCamera = await getPreferredCamera();
    selectedCameraRef.current = preferredCamera;

    return [
      preferredCamera?.deviceId,
      { facingMode: "environment" },
      { facingMode: { ideal: "environment" } },
      { facingMode: "user" }
    ].filter(Boolean);
  };

  const applyNativeCameraOptimizations = async () => {
    const videoTrack = getRunningVideoTrack();
    if (!videoTrack || typeof videoTrack.getCapabilities !== "function") return;

    try {
      const capabilities = videoTrack.getCapabilities();
      const advancedConstraints = {};

      if (Array.isArray(capabilities.focusMode)) {
        if (capabilities.focusMode.includes("continuous")) {
          advancedConstraints.focusMode = "continuous";
        } else if (capabilities.focusMode.includes("single-shot")) {
          advancedConstraints.focusMode = "single-shot";
        }
      }

      if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes("continuous")) {
        advancedConstraints.exposureMode = "continuous";
      }

      if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes("continuous")) {
        advancedConstraints.whiteBalanceMode = "continuous";
      }

      if (Object.keys(advancedConstraints).length && typeof videoTrack.applyConstraints === "function") {
        await videoTrack.applyConstraints({ advanced: [advancedConstraints] });
      }

      if (typeof videoTrack.applyConstraints === "function") {
        await videoTrack.applyConstraints({
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 30 }
        });
      }
    } catch (err) {
      console.warn("No se pudieron aplicar optimizaciones nativas de camara:", err);
    }
  };

  const getScannerConfig = (fps = 12) => ({
    fps,
    aspectRatio: 1.7777778,
    disableFlip: true,
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      return {
        width: Math.floor(minEdgeSize * 0.82),
        height: Math.floor(minEdgeSize * 0.82)
      };
    }
  });

  const createScanner = () => {
    const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
    qrInstanceRef.current = html5QrCode;
    return html5QrCode;
  };

  const startScannerWithCandidate = async (cameraCandidate, fps = 12) => {
    const html5QrCode = createScanner();
    await html5QrCode.start(
      cameraCandidate,
      getScannerConfig(fps),
      onScanSuccess,
      () => {}
    );
    cameraReadyRef.current = true;
  };

  const startCamera = async () => {
    const sessionId = cameraStartSessionRef.current + 1;
    cameraStartSessionRef.current = sessionId;
    const isCurrentSession = () => cameraStartSessionRef.current === sessionId;

    resetZoomControls();
    await stopScanner();
    if (!isCurrentSession()) return;

    isPausedRef.current = false;

    if (!window.isSecureContext) {
      safeSetStatus({
        msg: "La camara requiere HTTPS o localhost para abrirse en moviles.",
        type: "error"
      });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      safeSetStatus({
        msg: "Este navegador no permite acceso directo a la camara.",
        type: "error"
      });
      return;
    }

    let lastError = null;

    try {
      const cameraCandidates = await buildCameraStartCandidates();

      for (const cameraCandidate of cameraCandidates) {
        if (!isCurrentSession()) return;

        try {
          await stopScanner();
          if (!isCurrentSession()) return;

          await startScannerWithCandidate(cameraCandidate, 12);
          if (!isCurrentSession()) {
            await stopScanner();
            return;
          }

          lastError = null;
          break;
        } catch (candidateError) {
          if (!isCurrentSession()) return;

          lastError = candidateError;
          console.warn("Intento de camara fallido:", candidateError);
          await stopScanner();
        }
      }

      if (lastError || !qrInstanceRef.current?.isScanning) {
        throw lastError || new Error("No se pudo iniciar el scanner");
      }

      await applyNativeCameraOptimizations();
      safeSetStatus({ msg: "", type: "" });
      resetPreviewZoom();
      checkZoomCapabilities(0);
    } catch (error) {
      console.error(error);
      if (!isMountedRef.current) return;
      if (!isCurrentSession()) return;
      if (cameraReadyRef.current || qrInstanceRef.current?.isScanning) {
        safeSetStatus({ msg: "", type: "" });
        return;
      }

      const errorName = error?.name || "";
      const denied = errorName === "NotAllowedError" || errorName === "PermissionDeniedError";
      const busy = errorName === "NotReadableError" || errorName === "AbortError";
      const notFound = errorName === "NotFoundError" || errorName === "DevicesNotFoundError";

      let message = "Error de camara. Cierra otras apps que usen la camara y vuelve a intentar.";
      if (denied) message = "Permiso de camara bloqueado. Activalo desde los permisos del sitio y recarga.";
      if (busy) message = "La camara esta ocupada por otra app o pestana. Cierrala y vuelve a intentar.";
      if (notFound) message = "No se encontro una camara disponible en este dispositivo.";

      safeSetStatus({ msg: message, type: "error" });
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    scanSuccessRef.current = scanSuccess;
  }, [scanSuccess]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      void stopScanner();
    };
    // The scanner must be initialized once per panel mount; refs keep the live camera state current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      className="student-panel student-qr-panel"
      data-zoom-enabled={hasZoom}
      style={{ width: "100%", maxWidth: "960px", margin: "0 auto", boxSizing: "border-box" }}
    >
      <style>
        {`
          #${SCANNER_ELEMENT_ID},
          #${SCANNER_ELEMENT_ID} > div {
            width: 100% !important;
            height: 100% !important;
          }

          #${SCANNER_ELEMENT_ID} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            will-change: transform;
          }
        `}
      </style>
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
            width: "min(920px, calc(100vw - 24px))",
            height: "clamp(380px, 74svh, 760px)",
            margin: "0 50%",
            transform: "translateX(-50%)",
            borderRadius: "24px",
            overflow: "hidden",
            background: "#000",
            border: "4px solid #f1f5f9",
            position: "relative",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.22)"
          }}>
            <div id={SCANNER_ELEMENT_ID} style={{ width: "100%", height: "100%" }}></div>
          </div>

          {!loading && (
            <div style={{ width: "100%", maxWidth: "380px", margin: "20px auto 0", textAlign: "center" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "5px", fontWeight: "600" }}>
                Zoom: {zoomSettings.current.toFixed(1)}x
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => handleZoomStep(-1)}
                  disabled={zoomSettings.current <= zoomSettings.min}
                  aria-label="Alejar camara"
                  style={{
                    height: "44px", borderRadius: "12px", border: "1px solid #cbd5e1",
                    background: "#ffffff", color: "#1e293b", fontSize: "24px",
                    fontWeight: "700", cursor: zoomSettings.current <= zoomSettings.min ? "not-allowed" : "pointer",
                    opacity: zoomSettings.current <= zoomSettings.min ? 0.45 : 1
                  }}
                >
                  -
                </button>
                <input
                  type="range"
                  className="zoom-slider"
                  min={zoomSettings.min}
                  max={zoomSettings.max}
                  step={zoomSettings.step}
                  value={zoomSettings.current}
                  onChange={handleZoomChange}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    accentColor: "#2563eb",
                    opacity: 1
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleZoomStep(1)}
                  disabled={zoomSettings.current >= zoomSettings.max}
                  aria-label="Acercar camara"
                  style={{
                    height: "44px", borderRadius: "12px", border: "1px solid #cbd5e1",
                    background: "#ffffff", color: "#1e293b", fontSize: "24px",
                    fontWeight: "700", cursor: zoomSettings.current >= zoomSettings.max ? "not-allowed" : "pointer",
                    opacity: zoomSettings.current >= zoomSettings.max ? 0.45 : 1
                  }}
                >
                  +
                </button>
              </div>
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
