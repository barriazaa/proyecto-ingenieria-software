import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginWithEmail,
  loginWithGoogle,
} from "../application/AuthService";
import backgroundImage from "../../../assets/fondo-asistencia.png";

const LoginView = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const navigate = useNavigate();

  // LOGIN EMAIL
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginWithEmail(email, password);
      console.log("Usuario:", user);
      navigate("/home");
    } catch (error) {
      console.error(error);
      alert("Credenciales incorrectas o usuario no existe.");
    }
  };

  // LOGIN GOOGLE
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      console.log("Usuario:", user);
      navigate("/home");
    } catch (error) {
      console.error(error);
    }
  };

  const styles = { /* TODO igual que tu código */ };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.logoContainer}>
          <div style={styles.icon}>🎓</div>
          <h1 style={styles.title}>Asistencia UMG</h1>
        </div>

        {!showEmailForm && (
          <>
            <button style={styles.googleButton} onClick={handleGoogleLogin}>
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

        {showEmailForm && (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />

            <button type="submit" style={styles.button}>
              Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginView;