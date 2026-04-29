import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginView from "../modules/auth-registro/ui/LoginView";
import RegisterView from "../modules/auth-registro/ui/RegisterView";
import StudentView from "../modules/alumno/ui/StudentView";
import CatedraticoView from "../modules/Catedratico/ui/CatedraticoView";
import CoursesView from "../modules/cursos/ui/CoursesView";
import ReportView from "../modules/reporte/ui/ReportView";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import { AUTH_ROLES } from "../modules/auth-registro/domain/authRules";
import { ROUTES } from "../shared/utils/routePaths";

const TeacherRoute = ({ children }) => (
  <ProtectedRoute requiredRole={AUTH_ROLES.teacher}>{children}</ProtectedRoute>
);

const StudentRoute = ({ children }) => (
  <ProtectedRoute requiredRole={AUTH_ROLES.student}>{children}</ProtectedRoute>
);

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginView />} />
        <Route path={ROUTES.register} element={<RegisterView />} />

        <Route
          path={ROUTES.home}
          element={
            <TeacherRoute>
              <CatedraticoView />
            </TeacherRoute>
          }
        />
        <Route
          path={ROUTES.teacher}
          element={
            <TeacherRoute>
              <CatedraticoView />
            </TeacherRoute>
          }
        />
        <Route
          path={ROUTES.courses}
          element={
            <TeacherRoute>
              <CoursesView />
            </TeacherRoute>
          }
        />
        <Route
          path={ROUTES.reports}
          element={
            <TeacherRoute>
              <ReportView />
            </TeacherRoute>
          }
        />
        <Route
          path={ROUTES.students}
          element={
            <StudentRoute>
              <StudentView />
            </StudentRoute>
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
