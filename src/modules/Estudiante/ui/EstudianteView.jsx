import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion as Motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../../firebase/firebase";
import { ROUTES } from "../../../shared/utils/routePaths";
import EstudianteService from "../application/estudianteService";
import { getDefaultDateRange } from "../reportes/domain/attendanceReportRules";
import CourseDetail from "../reportes/ui/CourseDetail";
import CourseList from "./CourseList";
import QRScannerPanel from "./QRScannerPanel";
import "./EstudianteView.css";

const EstudianteView = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [range, setRange] = useState(getDefaultDateRange());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate(ROUTES.login);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const dashboard = await EstudianteService.getStudentDashboard(firebaseUser.uid);

        if (!isMounted) {
          return;
        }

        if (!dashboard.authorized) {
          navigate(ROUTES.home);
          return;
        }

        setStudent(dashboard.student);
        setCourses(dashboard.courses);
        setAttendances(dashboard.attendances);
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
      unsubscribe();
    };
  }, [navigate]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === courseId) || null,
    [courseId, courses]
  );

  const attendanceSummary = useMemo(() => {
    if (!selectedCourse) {
      return null;
    }

    return EstudianteService.getCourseAttendanceSummary(selectedCourse, attendances, range);
  }, [attendances, range, selectedCourse]);

  const handleRangeChange = (field, value) => {
    setRange((currentRange) => ({
      ...currentRange,
      [field]: value,
    }));
  };

  const handleCourseSelect = (course) => {
    navigate(`${ROUTES.students}/${course.id}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate(ROUTES.login);
    } catch (logoutError) {
      console.error(logoutError);
      setError("No se pudo cerrar sesion.");
    }
  };

  if (loading) {
    return <div className="student-page student-page--center">Cargando informacion...</div>;
  }

  if (error) {
    return <div className="student-page student-page--center">{error}</div>;
  }

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
          <div className="student-dashboard-grid">
            <QRScannerPanel />
            <CourseList courses={courses} onCourseSelect={handleCourseSelect} />
          </div>
        )}
      </Motion.div>
    </main>
  );
};

export default EstudianteView;
