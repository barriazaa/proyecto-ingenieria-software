import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import LoginView from "../modules/auth/ui/LoginView";
import RegisterView from "../modules/auth/ui/RegisterView";
import CatedraticoView from "../modules/Catedratico/ui/CatedraticoView";


const Home = () => <h1>Bienvenido 👋</h1>;


const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/home" element={<Home />} />
        <Route path= "/catedratico" element={<CatedraticoView />} />
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