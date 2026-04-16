import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import LoginView from "../modules/auth/ui/LoginView";
import RegisterView from "../modules/auth/ui/RegisterView";
import Catedratico from "../pages/Catedratico";
import Cursos from "../pages/Cursos";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/home" element={<Catedratico />} />
        <Route path="/catedratico" element={<Catedratico />} />
        <Route path="/cursos" element={<Cursos />} />
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