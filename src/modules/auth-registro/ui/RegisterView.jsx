import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AUTH_ROLE_OPTIONS } from "../domain/authRules";
import {
  registerCompleteUser,
  startGoogleRegistration,
} from "../application/AuthService";
import { ROUTES } from "../../../shared/utils/routePaths";

const RegisterView = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [rol, setRol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    carnet: "",
    nombres: "",
    apellidos: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleGoogleRegistration = async () => {
    try {
      setLoading(true);
      setError("");

      const firebaseUser = await startGoogleRegistration();
      setUser(firebaseUser);
      setForm((currentForm) => ({
        ...currentForm,
        nombres: currentForm.nombres || firebaseUser.displayName?.split(" ")[0] || "",
        apellidos:
          currentForm.apellidos ||
          firebaseUser.displayName?.split(" ").slice(1).join(" ") ||
          "",
      }));
    } catch (err) {
      setError(err.message || "Error con Google");
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await registerCompleteUser(user, rol, form);
      navigate(ROUTES.login);
    } catch (err) {
      setError(err.message || "Error al completar el registro");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2 style={styles.title}>Registro</h2>
        <p style={styles.subtitle}>
          Completa un unico flujo y selecciona el rol con el que usaras el sistema.
        </p>

        {!user && (
          <>
            <button
              type="button"
              style={styles.googleButton}
              onClick={handleGoogleRegistration}
              disabled={loading}
            >
              {loading ? "Conectando..." : "Continuar con Google"}
            </button>

            <button
              type="button"
              style={styles.linkButton}
              onClick={() => navigate(ROUTES.login)}
            >
              Volver al inicio de sesion
            </button>
          </>
        )}

        {user && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.emailBox}>{user.email}</div>

            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              style={styles.input}
            >
              <option value="">Selecciona un rol</option>
              {AUTH_ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>

            <input
              name="carnet"
              placeholder="Carnet"
              value={form.carnet}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="nombres"
              placeholder="Nombres"
              value={form.nombres}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              name="apellidos"
              placeholder="Apellidos"
              value={form.apellidos}
              onChange={handleChange}
              style={styles.input}
            />

            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contrasena"
                value={form.password}
                onChange={handleChange}
                style={{ ...styles.input, paddingRight: "76px" }}
              />
              <button
                type="button"
                style={styles.toggleButton}
                onClick={() => setShowPassword((currentValue) => !currentValue)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar contrasena"
              value={form.confirmPassword}
              onChange={handleChange}
              style={styles.input}
            />

            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? "Guardando..." : "Completar registro"}
            </button>
          </form>
        )}

        {error && <div style={styles.error}>{error}</div>}
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0D47A1",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "30px",
    borderRadius: "20px",
    background: "#000",
    color: "white",
    boxShadow: "0 0 40px rgba(255,152,0,0.4)",
  },
  title: {
    margin: 0,
    marginBottom: "8px",
  },
  subtitle: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#d0d7de",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emailBox: {
    padding: "12px",
    borderRadius: "10px",
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #333",
    background: "#111",
    color: "white",
    boxSizing: "border-box",
  },
  passwordWrapper: {
    position: "relative",
  },
  toggleButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#90CAF9",
    cursor: "pointer",
    fontSize: "12px",
  },
  googleButton: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#111",
    color: "white",
    cursor: "pointer",
    marginBottom: "12px",
  },
  primaryButton: {
    padding: "12px",
    background: "orange",
    border: "none",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
  },
  linkButton: {
    width: "100%",
    padding: "8px 0",
    background: "none",
    border: "none",
    color: "#90CAF9",
    cursor: "pointer",
  },
  error: {
    marginTop: "14px",
    color: "#ff6b6b",
  },
};

export default RegisterView;
