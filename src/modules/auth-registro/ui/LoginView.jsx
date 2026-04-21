import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { loginWithEmail, loginWithGoogle } from "../application/AuthService";
import { ROUTES } from "../../../shared/utils/routePaths";

const getLoginErrorMessage = (error) => {
  if (error.message === "Completa todos los campos") {
    return error.message;
  }

  if (error.message === "Usuario no registrado") {
    return "Tu cuenta no esta registrada.";
  }

  if (error.code === "auth/user-not-found") {
    return "El usuario no existe";
  }

  if (
    error.code === "auth/wrong-password" ||
    error.code === "auth/invalid-credential"
  ) {
    return "Contrasena incorrecta";
  }

  return "Error al iniciar sesion";
};

const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await loginWithEmail(email, password);
      navigate(ROUTES.home);
    } catch (err) {
      console.error(err);
      setError(getLoginErrorMessage(err));
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await loginWithGoogle();

      if (result.needsRegistration) {
        setError("Tu cuenta no esta registrada. Registrate primero.");
        setLoading(false);
        return;
      }

      navigate(ROUTES.home);
    } catch (err) {
      console.error(err);
      setError("Error al iniciar sesion con Google");
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

        <AnimatePresence>
          {error && (
            <motion.div
              style={styles.errorBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!showEmailForm && (
          <>
            <motion.button
              style={styles.googleButton}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
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
              type="button"
              style={styles.textButton}
              onClick={() => {
                setShowEmailForm(true);
                setError("");
              }}
            >
              Iniciar sesion con correo
            </button>

            <button
              type="button"
              style={styles.textButton}
              onClick={() => navigate(ROUTES.register)}
            >
              Registrarse
            </button>
          </>
        )}

        {showEmailForm && (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputWrapper}>
              <input
                type="email"
                placeholder="Correo electronico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />

              <button
                type="button"
                style={styles.eyeButton}
                onClick={() => setShowPassword((currentValue) => !currentValue)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <motion.button
              type="submit"
              style={styles.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesion"}
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
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(0, 0, 0, 0.85)",
    color: "white",
    textAlign: "center",
    boxSizing: "border-box",
    border: "1px solid #fb8c00",
    boxShadow: `
      0 10px 40px rgba(0,0,0,0.6),
      0 0 20px rgba(255, 123, 0, 0.64),
      0 0 50px #ff6f00e0
    `,
  },
  title: {
    marginBottom: "20px",
    fontWeight: "600",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "100%",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "14px 72px 14px 14px",
    borderRadius: "10px",
    border: "1px solid #333",
    background: "#111",
    color: "white",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: "12px",
    color: "#90CAF9",
    background: "transparent",
    border: "none",
  },
  button: {
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #FF6F00, #FF9800)",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
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
    marginBottom: "10px",
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
