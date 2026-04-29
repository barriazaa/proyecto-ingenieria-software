import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AUTH_ROLES } from "../../modules/auth-registro/domain/authRules";
import { ROUTES } from "../utils/routePaths";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    const redirectTo = userRole === AUTH_ROLES.teacher ? ROUTES.home : ROUTES.students;
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

const styles = {
  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#475569",
  },
};

export default ProtectedRoute;
