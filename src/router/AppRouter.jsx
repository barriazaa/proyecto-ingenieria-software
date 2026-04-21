import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LoginView from "../modules/auth-registro/ui/LoginView";
import RegisterView from "../modules/auth-registro/ui/RegisterView";
import StudentView from "../modules/alumno/ui/StudentView";
import TeacherDashboardView from "../modules/maestro/ui/TeacherDashboardView";
import CoursesView from "../modules/maestro/ui/CoursesView";
import ReportView from "../modules/reporte/ui/ReportView";
import { ROUTES } from "../shared/utils/routePaths";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path={ROUTES.login} element={<LoginView />} />
        <Route path={ROUTES.register} element={<RegisterView />} />
        <Route path={ROUTES.home} element={<TeacherDashboardView />} />
        <Route path={ROUTES.teacher} element={<TeacherDashboardView />} />
        <Route path={ROUTES.courses} element={<CoursesView />} />
        <Route path={ROUTES.students} element={<StudentView />} />
        <Route path={ROUTES.reports} element={<ReportView />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default AppRouter;
