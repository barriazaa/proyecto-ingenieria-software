import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginView from "../modules/auth-registro/ui/LoginView";
import RegisterView from "../modules/auth-registro/ui/RegisterView";
import EstudianteView from "../modules/Estudiante/ui/EstudianteView";
import CatedraticoView from "../modules/Catedratico/ui/CatedraticoView";
import CoursesView from "../modules/cursos/ui/CoursesView";
import ReportView from "../modules/reporte/ui/ReportView";
import { ROUTES } from "../shared/utils/routePaths";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginView />} />
        <Route path={ROUTES.register} element={<RegisterView />} />
        <Route path={ROUTES.home} element={<CatedraticoView />} />
        <Route path={ROUTES.teacher} element={<CatedraticoView />} />
        <Route path={ROUTES.courses} element={<CoursesView />} />
        <Route path={ROUTES.students} element={<EstudianteView />} />
        <Route path={`${ROUTES.students}/:courseId`} element={<EstudianteView />} />
        <Route path={ROUTES.reports} element={<ReportView />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
