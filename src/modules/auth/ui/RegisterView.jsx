import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { registerUser } from "../application/AuthService";
import { loginWithGoogleFirebase } from "../infrastructure/FirebaseAuthRepository";

const RegisterView = () => {
  const navigate = useNavigate();

  const [rol, setRol] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState(null);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    carnet: "",
    nombres: "",
    apellidos: "",
    confirmado: false,
  });

  const [errors, setErrors] = useState({});

  // Autocompletar Google
  useEffect(() => {
    if (user?.displayName) {
      const partes = user.displayName.split(" ");
      setForm((prev) => ({
        ...prev,
        nombres: partes[0] || "",
        apellidos: partes.slice(1).join(" ") || "",
      }));
    }
  }, [user]);

  // Validaciones
  const validate = (name, value) => {
    let error = "";

    if (!value) error = "Este campo es obligatorio";
    if (name === "carnet" && value && !/^\d+$/.test(value)) {
      error = "Solo números";
    }

    return error;
  };

  // Inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm({ ...form, [name]: newValue });

    if (type !== "checkbox") {
      setErrors({
        ...errors,
        [name]: validate(name, newValue),
      });
    }
  };

  // Login Google
  const handleRegister = async (rolSeleccionado) => {
    try {
      setLoading(true);
      const firebaseUser = await loginWithGoogleFirebase();
      if (!firebaseUser) return;

      setUser(firebaseUser);
      setRol(rolSeleccionado);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      carnet: validate("carnet", form.carnet),
      nombres: validate("nombres", form.nombres),
      apellidos: validate("apellidos", form.apellidos),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e)) return;

    if (!form.confirmado) {
      setErrors((prev) => ({
        ...prev,
        confirmado: "Debes confirmar los datos",
      }));
      return;
    }

    try {
      setLoading(true);
      setServerError("");

      await registerUser(user, rol, form);
      navigate("/");
    } catch (error) {
      console.error(error);
      setServerError(error.message || "Error al registrar usuario");
    }

    setLoading(false);
  };

  return (
    <motion.div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.rightPanel}>
          <h2>Registro</h2>

          {!user && (
            <>
              <motion.button
                style={styles.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRegister("estudiante")}>
                Estudiante
              </motion.button>

              <motion.button
                style={styles.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRegister("catedratico")}>
                Catedrático
              </motion.button>
            </>
          )}

          {user && (
            <>
              <div style={styles.avatarContainer}>
                <img src={user.photoURL} alt="avatar" style={styles.avatar} />
                <p>{user.email}</p>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>

                {/* CARNET */}
                <div style={{
                  ...styles.inputGroup,
                  ...(focus === "carnet" ? styles.focus : {}),
                  ...(errors.carnet ? styles.errorBorder : {})
                }}>
                  <input
                    name="carnet"
                    placeholder="Número de carnet"
                    value={form.carnet}
                    onChange={handleChange}
                    onFocus={() => setFocus("carnet")}
                    onBlur={() => setFocus(null)}
                    style={styles.input}
                  />
                </div>
                {errors.carnet && <span style={styles.errorText}>{errors.carnet}</span>}

                {/* NOMBRES */}
                <div style={{
                  ...styles.inputGroup,
                  ...(focus === "nombres" ? styles.focus : {}),
                  ...(errors.nombres ? styles.errorBorder : {})
                }}>
                  <input
                    name="nombres"
                    placeholder="Nombres"
                    value={form.nombres}
                    onChange={handleChange}
                    onFocus={() => setFocus("nombres")}
                    onBlur={() => setFocus(null)}
                    style={styles.input}
                  />
                </div>
                {errors.nombres && <span style={styles.errorText}>{errors.nombres}</span>}

                {/* APELLIDOS */}
                <div style={{
                  ...styles.inputGroup,
                  ...(focus === "apellidos" ? styles.focus : {}),
                  ...(errors.apellidos ? styles.errorBorder : {})
                }}>
                  <input
                    name="apellidos"
                    placeholder="Apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    onFocus={() => setFocus("apellidos")}
                    onBlur={() => setFocus(null)}
                    style={styles.input}
                  />
                </div>
                {errors.apellidos && <span style={styles.errorText}>{errors.apellidos}</span>}

                {/* CHECK */}
                <div style={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="confirmado"
                    checked={form.confirmado}
                    onChange={handleChange}
                  />
                  <span style={styles.checkboxText}>
                    Confirmo que mis datos son correctos
                  </span>
                </div>

                {errors.confirmado && (
                  <span style={styles.errorText}>{errors.confirmado}</span>
                )}

                <motion.button
                  style={styles.submitButton}
                  whileHover={{ scale: 1.03, opacity: 0.95 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Completar Registro"}
                </motion.button>

                {serverError && (
                  <div style={styles.serverError}>
                    {serverError}
                  </div>
                )}

              </form>
            </>
          )}

          <button
            style={styles.link}
            onClick={() => navigate("/")}
            onMouseEnter={(e) => (e.target.style.opacity = "1")}
            onMouseLeave={(e) => (e.target.style.opacity = "0.7")}
          >
            ¿Ya tienes cuenta? <b>Inicia sesión</b>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// 🔥 ESTILOS (FUERA DEL COMPONENTE)
const styles = {
  container: {
    fontFamily: "Poppins, sans-serif",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0D47A1",
  },
  card: {
    width: "90%",
    maxWidth: "400px",
    background: "#000",
    borderRadius: "20px",
    padding: "25px",
  },
  rightPanel: { color: "white" },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    background: "linear-gradient(135deg, #FF6F00, #FF9800)",
    border: "none",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
  },
  form: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  inputGroup: {
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "12px",
  },
  checkboxText: {
    fontSize: "13px",   // 🔥 más pequeño
    color: "#bbb",      // 🔥 más suave
  },
  focus: { border: "1px solid #2196F3" },
  errorBorder: { border: "1px solid red" },
  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "white",
    outline: "none",
  },
  errorText: { color: "red", fontSize: "12px" },
  checkboxContainer: { display: "flex", gap: "10px" },
  submitButton: {
    padding: "14px",
    background: "linear-gradient(135deg, #FF6F00, #FF9800)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(255, 152, 0, 0.3)",
  },
  avatarContainer: { textAlign: "center", marginBottom: "15px" },
  avatar: { width: "60px", height: "60px", borderRadius: "50%" },
  serverError: {
    marginTop: "10px",
    padding: "10px",
    background: "rgba(255,0,0,0.1)",
    color: "#ff6b6b",
    borderRadius: "8px",
    textAlign: "center",
  },
  link: {
    marginTop: "20px",
    background: "none",
    border: "none",
    color: "#90CAF9",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Poppins, sans-serif",
    display: "block",
    margin: "20px auto 0",
    opacity: 0.8,
    letterSpacing: "0.5px",
  }
};

export default RegisterView;