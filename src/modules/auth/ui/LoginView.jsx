import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginWithEmail,
  loginWithGoogle,
  registerUser,
} from "../application/AuthService";
import backgroundImage from "../../../assets/fondo-asistencia.png";
import { motion, AnimatePresence } from "framer-motion";

const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);


  const navigate = useNavigate();

  // 🔐 LOGIN EMAIL
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      navigate("/home");
    } catch (error) {
      console.error(error);
      alert("Credenciales incorrectas o usuario no existe.");
    }
  };

  // 🔐 LOGIN GOOGLE
  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();

      if (result.needsRegistration) {
        alert("Usuario no registrado. Debe registrarse primero.");
        return;
      }

      navigate("/home");
    } catch (error) {
      console.error(error);
    }
  };

  // 📝 REGISTRO (desde panel)
  const handleRegister = async (rol) => {
    try {
      const result = await loginWithGoogle();

      if (!result.needsRegistration) {
        alert("Este usuario ya está registrado");
        return;
      }

      await registerUser(result.firebaseUser, rol);

      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      setShowRegister(false);
    } catch (error) {
      console.error(error);
      alert("Error en registro");
    }
  };

  const styles = {
    container: {
      height: "100vh",
      width: "100vw",
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "fixed",
      top: 0,
      left: 0,
    },

    loginBox: {
      width: "350px",
      padding: "40px",
      borderRadius: "15px",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(10px)",
      textAlign: "center",
      color: "white",
    },

    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "10px",
      borderRadius: "8px",
      border: "none",
    },

    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(135deg, #F57C00, #FF9800)",
      color: "white",
      cursor: "pointer",
      fontWeight: "bold",
    },

    googleButton: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #dadce0",
      backgroundColor: "white",
      marginBottom: "10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      color: "#3c4043",
    },

    textButton: {
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      marginTop: "10px",
      textDecoration: "underline",
    },

    // 🔥 PANEL REGISTRO
    registerPanel: {
      position: "fixed",
      bottom: 0,
      left: 0,
      width: "100%",
      height: "70%",
      background: "linear-gradient(135deg, #0D47A1, #2196F3)",
      borderTopLeftRadius: "25px",
      borderTopRightRadius: "25px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 -10px 30px rgba(0,0,0,0.5)",
      zIndex: 1000,
      color: "white",
    },
  };

  return (
    <>
      {/* 🔐 LOGIN */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4 }}
        style={styles.container}
      >
        <div style={styles.loginBox}>
          <h1>Control de Asistencia</h1>

          {!showEmailForm && (
            <>
              <button
                style={styles.googleButton}
                onClick={handleGoogleLogin}
              >
                <img
                  src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                  width="18"
                  alt="Google"
                />
                Continuar con Google
              </button>

              <button
                style={styles.textButton}
                onClick={() => setShowEmailForm(true)}
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
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Correo"
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

              <button type="submit" style={styles.button}>
                Iniciar sesión
              </button>

              <button
                type="button"
                style={styles.textButton}
                onClick={() => setShowEmailForm(false)}
              >
                Volver
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default LoginView;