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
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    carnet: "",
    nombres: "",
    apellidos: "",
    confirmado: false,
  });

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
    if (!value) return "Este campo es obligatorio";
    if (name === "carnet" && !/^\d+$/.test(value)) return "Solo números";
    return "";
  };

  // Inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (type !== "checkbox") {
      setErrors((prev) => ({
        ...prev,
        [name]: validate(name, newValue),
      }));
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
    } finally {
      setLoading(false);
    }
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div style={styles.container}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        whileHover={{
          scale: 1.01,
          boxShadow: `
        0 10px 40px rgba(203, 91, 0, 0.6),
        0 0 40px rgba(255, 152, 0, 0.5),
        0 0 80px rgba(255, 119, 0, 0.9)
          `,
        }}
      >
        <div style={styles.rightPanel}>
          <h2>Registro</h2>

          {!user && (
            <>
              <motion.button style={styles.button} onClick={() => handleRegister("estudiante")}>
                Estudiante
              </motion.button>

              <motion.button style={styles.button} onClick={() => handleRegister("catedratico")}>
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
                <div
                  style={{
                    ...styles.inputContainer,
                    ...(focus === "carnet" ? styles.focus : {}),
                    ...(errors.carnet ? styles.errorBorder : {}),
                  }}
                >
                  <label
                    style={{
                      ...styles.floatingLabel,
                      ...(focus === "carnet" || form.carnet ? styles.labelActive : {}),
                    }}
                  >
                    Número de carnet
                  </label>

                  <input
                    type="text"
                    name="carnet"
                    value={form.carnet}
                    onChange={handleChange}
                    onFocus={() => setFocus("carnet")}
                    onBlur={() => setFocus(null)}
                    style={styles.input}
                  />
                </div>
                {errors.carnet && <span style={styles.errorText}>{errors.carnet}</span>}

                {/* NOMBRES */}
                <div
                  style={{
                    ...styles.inputContainer,
                    ...(focus === "nombres" ? styles.focus : {}),
                    ...(errors.nombres ? styles.errorBorder : {}),
                  }}
                >
                  <label
                    style={{
                      ...styles.floatingLabel,
                      ...(focus === "nombres" || form.nombres ? styles.labelActive : {}),
                    }}
                  >
                    Nombres
                  </label>

                  <input
                    type="text"
                    name="nombres"
                    value={form.nombres}
                    onChange={handleChange}
                    onFocus={() => setFocus("nombres")}
                    onBlur={() => setFocus(null)}
                    style={styles.input}
                  />
                </div>
                {errors.nombres && <span style={styles.errorText}>{errors.nombres}</span>}

                {/* APELLIDOS */}
                <div
                  style={{
                    ...styles.inputContainer,
                    ...(focus === "apellidos" ? styles.focus : {}),
                    ...(errors.apellidos ? styles.errorBorder : {}),
                  }}
                >
                  <label
                    style={{
                      ...styles.floatingLabel,
                      ...(focus === "apellidos" || form.apellidos ? styles.labelActive : {}),
                    }}
                  >
                    Apellidos
                  </label>

                  <input
                    type="text"
                    name="apellidos"
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

                <button style={styles.submitButton} disabled={loading}>
                  {loading ? "Guardando..." : "Completar Registro"}
                </button>

                {serverError && (
                  <div style={styles.serverError}>
                    {serverError}
                  </div>
                )}
              </form>
            </>
          )}

          <button style={styles.link} onClick={() => navigate("/")}>
            ¿Ya tienes cuenta? <b>Inicia sesión</b>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Nuevos ESTILOS lud
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
    maxWidth: "420px",
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(0, 0, 0, 0.9)",
    color: "white",
    boxSizing: "border-box",
    border: "1px solid #fb8c00",
    boxShadow: `
    0 10px 40px rgba(0,0,0,0.6),
    0 0 20px rgba(255, 123, 0, 0.64),
    0 0 50px #ff6f00e0
    `,
  },

  rightPanel: {
    color: "white"
  },

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
    gap: "12px"
  },

  inputGroup: {
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "12px",
    boxSizing: "border-box",
  },

  focus: {
    border: "1px solid #2196F3",
    boxShadow: "0 0 10px rgba(255,152,0,0.4)",
  },

  errorBorder: {
    border: "1px solid red"
  },

  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "white",
    outline: "none"
  },

  errorText: {
    color: "red",
    fontSize: "12px"
  },

  checkboxContainer: {
    display: "flex",
    gap: "10px"
  },

  checkboxText: {
    fontSize: "13px",
    color: "#bbb"
  },

  submitButton: {
    padding: "14px",
    background: "linear-gradient(135deg, #FF6F00, #FF9800)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  avatarContainer: {
    textAlign: "center",
    marginBottom: "15px"
  },

  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%"
  },

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
    display: "block",
    margin: "20px auto 0",
  },

  inputContainer: {
    position: "relative",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "14px 12px 10px 12px",
    background: "#111",
    transition: "0.3s",
  },

  floatingLabel: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#888",
    pointerEvents: "none",
    transition: "0.3s",
    background: "#111",
    padding: "0 5px",
  },

  labelActive: {
    top: "-8px",
    fontSize: "11px",
    color: "#FF9800",
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
    fontSize: "14px",
  },
};
export default RegisterView; 