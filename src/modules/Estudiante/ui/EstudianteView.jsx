import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion as Motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../../firebase/firebase";
import { ROUTES } from "../../../shared/utils/routePaths";
import EstudianteService from "../application/estudianteService";
import CourseDetail from "../reportes/ui/CourseDetail";
import CourseList from "./CourseList";
import QRScannerPanel from "./QRScannerPanel";
import "./EstudianteView.css";

const EMPTY_DATE_RANGE = {
  startDate: "",
  endDate: "",
};

const EstudianteView = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [range, setRange] = useState(EMPTY_DATE_RANGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estado para controlar la pestaña activa ('cursos' o 'escanear')
  const [activeTab, setActiveTab] = useState("cursos");

  useEffect(() => {
    let isMounted = true;
    let unsubscribeAttendances = () => {};

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeAttendances();
      setAttendances([]);

      if (!firebaseUser) {
        navigate(ROUTES.login);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const dashboard = await EstudianteService.getStudentDashboard(firebaseUser.uid);

        if (!isMounted) return;

        if (!dashboard.authorized) {
          navigate(ROUTES.home);
          return;
        }

        setStudent(dashboard.student);
        setCourses(dashboard.courses);
        setAttendances(dashboard.attendances);
        unsubscribeAttendances = EstudianteService.subscribeToStudentAttendances(
          dashboard.student,
          {
            onData: (liveAttendances) => {
              if (isMounted) {
                setAttendances(liveAttendances);
              }
            },
            onError: (liveError) => {
              console.error(liveError);
              if (isMounted) {
                setError("No se pudo escuchar tu asistencia en tiempo real.");
              }
            },
          }
        );
      } catch (loadError) {
        console.error(loadError);
        if (isMounted) {
          setError(loadError.message || "No se pudo cargar la vista del estudiante.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAttendances();
      unsubscribe();
    };
  }, [navigate]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) || null,
    [courseId, courses]
  );

  const attendanceSummary = useMemo(() => {
    if (!selectedCourse) return null;
    return EstudianteService.getCourseAttendanceSummary(selectedCourse, attendances, range);
  }, [attendances, range, selectedCourse]);

  const handleRangeChange = (field, value) => {
    setRange((currentRange) => ({ ...currentRange, [field]: value }));
  };

  const handleCourseSelect = (course) => {
    navigate(`${ROUTES.students}/${course.id}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate(ROUTES.login);
    } catch {
      setError("No se pudo cerrar sesion.");
    }
  };

  if (loading) return <div className="student-page student-page--center">Cargando informacion...</div>;

  if (error) return <div className="student-page student-page--center">{error}</div>;

  return (
    <main className="student-page">
      <Motion.div
        className="student-shell"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <header className="student-header">
          <div>
            <span className="student-eyebrow">Panel estudiante</span>
            <h1>Hola, {student?.nombre || "estudiante"}</h1>
            <p>Consulta tus cursos, revisa tu asistencia.</p>
          </div>
          <button type="button" className="student-logout-button" onClick={handleLogout}>
            Cerrar
          </button>
        </header>

        {selectedCourse && attendanceSummary ? (
          <CourseDetail
            course={selectedCourse}
            range={range}
            summary={attendanceSummary}
            onRangeChange={handleRangeChange}
            onBack={() => navigate(ROUTES.students)}
          />
        ) : (
          <div className="student-dashboard-content">
            
            {/* NAVEGACIÓN DE PESTAÑAS MEJORADA VISUALMENTE */}
            <nav className="student-tabs-nav" style={{ 
              display: 'flex', 
              background: 'rgba(255, 255, 255, 0.15)', 
              padding: '6px', 
              borderRadius: '14px', 
              marginBottom: '25px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <button 
                className={`tab-btn ${activeTab === 'cursos' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab("cursos")}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeTab === 'cursos' ? '#ffffff' : 'transparent',
                  color: activeTab === 'cursos' ? '#2563eb' : '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: activeTab === 'cursos' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                Mis Cursos
              </button>
              <button 
                className={`tab-btn ${activeTab === 'escanear' ? 'tab-btn--active' : ''}`}
                onClick={() => setActiveTab("escanear")}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeTab === 'escanear' ? '#ffffff' : 'transparent',
                  color: activeTab === 'escanear' ? '#2563eb' : '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: activeTab === 'escanear' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                Escanear Asistencia
              </button>
            </nav>

            {/* CONTENIDO CONDICIONAL POR PESTAÑA */}
            <div className="student-tab-panel">
              {activeTab === "cursos" ? (
                <CourseList courses={courses} onCourseSelect={handleCourseSelect} />
              ) : (
                <QRScannerPanel 
                   onSuccessComplete={() => setActiveTab("cursos")} 
                />
              )}
            </div>

          </div>
        )}
      </Motion.div>
    </main>
  );
}; 

export default EstudianteView;