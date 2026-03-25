import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginWithEmail,
  loginWithGoogle,
} from "../application/AuthService";
import { motion, AnimatePresence } from "framer-motion";

const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  //  LOGIN EMAIL
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await loginWithEmail(email, password);
      navigate("/home");
    } catch (err) {
      console.error(err);

      if (err.code === "auth/user-not-found") {
        setError("El usuario no existe");
      } else if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta");
      } else {
        setError("Error al iniciar sesión");
      }
    }

    setLoading(false);
  };

  //  LOGIN GOOGLE
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await loginWithGoogle();

      if (result.needsRegistration) {
        setError("Tu cuenta no está registrada. Regístrate primero.");
        setLoading(false);
        return;
      }

      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Error al iniciar sesión con Google");
    }

    setLoading(false);
  };

  return (
    <motion.div style={styles.container}>
      <motion.div
        style={styles.loginBox}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 style={styles.title}>Control de Asistencia</h1>

        {/* ERROR */}
        <AnimatePresence>
          {error && (
            <motion.div
              style={styles.errorBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ⚠ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* GOOGLE */}
        {!showEmailForm && (
          <>
            <motion.button
              style={styles.googleButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <img
                src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                width="18"
                alt="Google"
              />
              {loading ? "Cargando..." : "Continuar con Google"}
            </motion.button>

            <button
              style={styles.textButton}
              onClick={() => {
                setShowEmailForm(true);
                setError("");
              }}
            >
              Iniciar sesión con correo
            </button>

            <button
              style={styles.textButton}
              onClick={() => navigate("/register")}
            >
              Registrarse
            </button>
          </>
        )}

        {showEmailForm && (
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <motion.button
              type="submit"
              style={styles.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </motion.button>

            <button
              type="button"
              style={styles.textButton}
              onClick={() => {
                setShowEmailForm(false);
                setError("");
              }}
            >
              Volver
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};


const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    background: "linear-gradient(135deg, #0D47A1, #2196F3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Poppins, sans-serif",
  },

  loginBox: {
    width: "90%",
    maxWidth: "380px",
    padding: "35px",
    borderRadius: "20px",
    background: "rgba(0, 0, 0, 0.85)",
    color: "white",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    textAlign: "center",
  },

  title: {
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #333",
    background: "#111",
    color: "white",
    outline: "none",
  },

  button: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #FF6F00, #FF9800)",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },

  googleButton: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#111",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },

  textButton: {
    background: "none",
    border: "none",
    color: "#90CAF9",
    cursor: "pointer",
    marginTop: "10px",
    fontSize: "14px",
  },

  errorBox: {
    marginBottom: "15px",
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(255, 0, 0, 0.1)",
    color: "#ff6b6b",
    fontSize: "13px",
  },
};

export default LoginView;