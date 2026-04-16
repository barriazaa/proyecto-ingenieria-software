import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AUTH_ROLE_OPTIONS } from "../domain/authRules";
import { registerCompleteUser,
        startGoogleRegistration,
} from "../application/AuthService";
import { ROUTES } from "../../../shared/utils/routePaths";

const GOOGLE_ICON_SRC =
  "https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg";
const DEFAULT_AVATAR =
  "https://www.gravatar.com/avatar/?d=mp&s=160";

const RegisterField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  focusedField,
  setFocusedField,
  trailingAction = null,
  readOnly = false,
}) => (
  <label style={styles.field}>
    <span style={styles.fieldLabel}>{label}</span>
    <div style={styles.inputShell}>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        onFocus={() => setFocusedField(name)}
        onBlur={() => setFocusedField("")}
        style={{
          ...styles.input,
          ...(focusedField === name ? styles.inputFocused : {}),
          ...(readOnly ? styles.inputReadOnly : {}),
          ...(trailingAction ? styles.inputWithAction : {}),
        }}
      />
      {trailingAction}
    </div>
  </label>
);

const RegisterView = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [rol, setRol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

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
      <div style={styles.backgroundGlowTop} />
      <div style={styles.backgroundGlowBottom} />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div style={styles.header}>
          <span style={styles.eyebrow}>Registro Control de asistencia</span>
        </div>

        {!user && (
          <div style={styles.authEntry}>
            <button
              type="button"
              style={styles.googleButton}
              onClick={handleGoogleRegistration}
              disabled={loading}
            >
              <span style={styles.googleIconWrap}>
                <img src={GOOGLE_ICON_SRC} width="20" height="20" alt="Google" />
              </span>
              <span style={styles.googleButtonText}>
                {loading ? "Conectando con Google..." : "Continuar con Google"}
              </span>
            </button>

            <button
              type="button"
              style={styles.linkButton}
              onClick={() => navigate(ROUTES.login)}
            >
              Volver al inicio de sesion
            </button>
          </div>
        )}

        {user && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.profileSection}>
              <div style={styles.avatarFrame}>
                <img
                  src={user.photoURL || DEFAULT_AVATAR}
                  alt={user.email || "Usuario"}
                  style={styles.avatar}
                />
              </div>
              <p style={styles.profileEmail}>{user.email}</p>
            </div>

            <div style={styles.formGrid}>
              <RegisterField
                label="Correo"
                name="email"
                value={user.email}
                onChange={() => {}}
                placeholder="Correo electronico"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                readOnly
              />
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Rol</span>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  onFocus={() => setFocusedField("rol")}
                  onBlur={() => setFocusedField("")}
                  style={{
                    ...styles.input,
                    ...styles.select,
                    ...(focusedField === "rol" ? styles.inputFocused : {}),
                  }}
                >
                  <option value="">Selecciona un rol</option>
                  {AUTH_ROLE_OPTIONS.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
              </label>
              <RegisterField
                label="Carnet"
                name="carnet"
                value={form.carnet}
                onChange={handleChange}
                placeholder="Ingresa tu carnet"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <RegisterField
                label="Nombre"
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                placeholder="Ingresa tu nombre"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <RegisterField
                label="Apellido"
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                placeholder="Ingresa tu apellido"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <RegisterField
                label="Contrasena"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Crea una contrasena"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                trailingAction={
                  <button
                    type="button"
                    style={styles.toggleButton}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                }
              />
              <RegisterField
                label="Confirmar contrasena"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirma tu contrasena"
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                trailingAction={
                  <button
                    type="button"
                    style={styles.toggleButton}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                }
              />
            </div>

            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? "Guardando..." : "Completar registro"}
            </button>

            <button
              type="button"
              style={styles.bottomLink}
              onClick={() => navigate(ROUTES.login)}
            >
              ¿Ya tienes cuenta? Inicia sesion
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
    padding: "24px",
    background:
      "radial-gradient(circle at top left, rgba(96, 165, 250, 0.28), transparent 32%), linear-gradient(160deg, #eef4ff 0%, #dce8ff 48%, #f5f9ff 100%)",
    fontFamily: "'Poppins', 'Inter', 'Roboto', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlowTop: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    top: "-120px",
    right: "-80px",
    background: "rgba(37, 99, 235, 0.14)",
    filter: "blur(18px)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "999px",
    bottom: "-120px",
    left: "-60px",
    background: "rgba(56, 189, 248, 0.18)",
    filter: "blur(18px)",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "560px",
    padding: "34px",
    borderRadius: "30px",
    background: "rgba(255, 255, 255, 0.94)",
    color: "#0f172a",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    boxShadow: "0 24px 64px rgba(15, 23, 42, 0.14)",
    backdropFilter: "blur(12px)",
  },
  header: {
    marginBottom: "24px",
  },
  eyebrow: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: "1.1",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#475569",
    lineHeight: "1.7",
    fontSize: "14px",
  },
  authEntry: {
    display: "grid",
    gap: "12px",
  },
  googleButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 18px",
    borderRadius: "18px",
    border: "1px solid #dbe3f4",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.06)",
  },
  googleIconWrap: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    flexShrink: 0,
  },
  googleButtonText: {
    fontWeight: "700",
    fontSize: "15px",
  },
  linkButton: {
    width: "100%",
    padding: "10px 0",
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "700",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  profileSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "4px",
  },
  avatarFrame: {
    width: "96px",
    height: "96px",
    borderRadius: "999px",
    padding: "4px",
    background: "linear-gradient(135deg, #f59e0b, #fb7185, #2563eb)",
    boxShadow: "0 18px 34px rgba(37, 99, 235, 0.18)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "999px",
    display: "block",
    background: "#e2e8f0",
  },
  profileEmail: {
    margin: 0,
    color: "#1e3a8a",
    fontSize: "17px",
    fontWeight: "700",
    textAlign: "center",
    wordBreak: "break-word",
  },
  heroStrip: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #eff6ff, #f8fbff)",
    border: "1px solid #dbeafe",
  },
  heroLabel: {
    display: "block",
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  heroText: {
    margin: "4px 0 0",
    color: "#334155",
    fontSize: "14px",
  },
  heroDot: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    background: "#22c55e",
    boxShadow: "0 0 0 6px rgba(34, 197, 94, 0.14)",
    flexShrink: 0,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px 18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fieldLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  inputShell: {
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #d5deeb",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
    outline: "none",
    boxShadow: "0 6px 18px rgba(148, 163, 184, 0.08)",
    transition: "all 0.2s ease",
    fontSize: "14px",
  },
  inputFocused: {
    borderColor: "#60a5fa",
    boxShadow: "0 0 0 4px rgba(96, 165, 250, 0.18)",
  },
  inputReadOnly: {
    background: "#f8fafc",
    color: "#475569",
  },
  inputWithAction: {
    paddingRight: "88px",
  },
  select: {
    appearance: "none",
  },
  toggleButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: "4px",
    padding: "15px 18px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    border: "none",
    borderRadius: "18px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
    boxShadow: "0 16px 32px rgba(37, 99, 235, 0.24)",
  },
  bottomLink: {
    border: "none",
    background: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
    padding: 0,
    alignSelf: "center",
  },
  error: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    fontWeight: "600",
  },
};

export default RegisterView;
