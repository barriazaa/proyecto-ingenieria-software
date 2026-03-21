import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../application/AuthService";
import { loginWithGoogleFirebase } from "../infrastructure/FirebaseAuthRepository";

const RegisterView = () => {
  const navigate = useNavigate();

  const handleRegister = async (rol) => {
    try {
      // 🔥 1. Obtener usuario desde Google (DIRECTO)
      const firebaseUser = await loginWithGoogleFirebase();

      if (!firebaseUser) {
        alert("Error con Google");
        return;
      }

      // 🔥 2. Registrar en Firestore
      await registerUser(firebaseUser, rol);

      // 🔥 3. Confirmación
      alert("Registro exitoso. Ahora puedes iniciar sesión.");

      // 🔥 4. Volver al login
      navigate("/");
    } catch (error) {
      console.error("ERROR REGISTRO:", error);
      alert(error.message || "Error en registro");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      style={styles.container}
    >
      <div style={styles.card}>
        
        {/* PANEL IZQUIERDO */}
        <div style={styles.leftPanel}>
          <h1 style={styles.welcome}>¡BIENVENIDO!</h1>
          <p>Regístrate para comenzar</p>
        </div>

        {/* PANEL DERECHO */}
        <div style={styles.rightPanel}>
          <h2>Registro</h2>

          <button
            style={styles.button}
            onClick={() => handleRegister("estudiante")}
          >
            Registrarme como Estudiante
          </button>

          <button
            style={styles.button}
            onClick={() => handleRegister("catedratico")}
          >
            Registrarme como Catedrático
          </button>

          <button
            style={styles.link}
            onClick={() => navigate("/")}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0D47A1, #2196F3)",
  },

  card: {
    width: "800px",
    height: "400px",
    display: "flex",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 0 30px rgba(0,0,0,0.5)",
  },

  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, #1565C0, #2196F3)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  welcome: {
    fontSize: "32px",
    fontWeight: "bold",
  },

  rightPanel: {
    flex: 1,
    background: "rgba(0,0,0,0.85)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "30px",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #F57C00, #FF9800)",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s",
  },

  link: {
    marginTop: "20px",
    background: "none",
    border: "none",
    color: "#2196F3",
    cursor: "pointer",
  },
};

export default RegisterView;