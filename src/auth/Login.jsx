// src/auth/Login.jsx
import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/fondo-asistencia.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Estado para controlar si se muestra el formulario de correo
  const [showEmailForm, setShowEmailForm] = useState(false);
  const navigate = useNavigate();

  // Login tradicional
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuario autenticado:", result.user);
      navigate("/home");
    } catch (error) {
      console.error("Error login:", error);
      alert("Credenciales incorrectas o usuario no existe.");
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (error) {
      console.error("Error Google Login:", error);
    }
  };

  const styles = {
    container: {
      height: "100vh",
      width: "100vw",
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat", 
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "fixed",
      top: 0,
      left: 0,
      margin: 0,
      padding: 0,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    loginBox: {
      width: "350px",
      padding: "40px",
      borderRadius: "15px",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      border: "1px rgba(255, 255, 255, 0.18) solid",
      textAlign: "center",
      color: "white",
      transition: "all 0.5s ease", 
    },
    logoContainer: { marginBottom: "30px" },
    icon: { fontSize: "50px", color: "#00c4cc", marginBottom: "10px" },
    title: { fontSize: "22px", fontWeight: "600", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "1px" },
    input: {
      width: "100%",
      padding: "12px 15px",
      marginBottom: "15px",
      borderRadius: "8px",
      border: "1px rgba(255, 255, 255, 0.3) solid",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "white",
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
    },
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#7e3af2",
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      marginTop: "10px",
    },
    googleButton: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid white",
      backgroundColor: "white",
      color: "#444",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      marginBottom: "15px",
    },
    textButton: {
      background: "none",
      border: "none",
      color: "white",
      textDecoration: "underline",
      cursor: "pointer",
      fontSize: "14px",
      marginTop: "10px",
      opacity: 0.9
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.logoContainer}>
          <div style={styles.icon}>🎓</div>
          <h1 style={styles.title}>Asistencia UMG</h1>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '20px' }}>SISTEMA DE CONTROL</div>
        </div>

        {/* BOTÓN DE GOOGLE*/}
        {!showEmailForm && (
          <>
            <button style={styles.googleButton} onClick={handleGoogleLogin}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
              Continuar con Google
            </button>

            <button
              style={styles.textButton}
              onClick={() => setShowEmailForm(true)}
            >
              O iniciar sesión con correo
            </button>
          </>
        )}

        {/* FORMULARIO DESPLEGABLE - Se muestra si showEmailForm es true */}
        {showEmailForm && (
          <form onSubmit={handleLogin} style={{ animation: "fadeIn 0.5s" }}>
            <input
              type="email"
              placeholder="micorreo@miumg.edu.gt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />

            <button type="submit" style={styles.button}>
              Sign In
            </button>

            <button
              style={styles.textButton}
              onClick={() => setShowEmailForm(false)}
            >
              Volver atrás
            </button>
          </form>
        )}

        {/* Sección opcional inferior */}
        <div style={{
          marginTop: "25px",
          fontSize: "11px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          opacity: 0.8
        }}>
          <a href="#" style={{ color: "white", textDecoration: "none" }}>¿Olvidó su contraseña?</a>
          <a href="#" style={{ color: "white", textDecoration: "none" }}>Ayuda</a>
          <a href="#" style={{ color: "white", textDecoration: "none" }}>Registrarse</a>
        </div>
      </div>
    </div>
  );
};

export default Login; 