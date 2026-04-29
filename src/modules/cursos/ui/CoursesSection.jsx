import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import QrGenerator from "./QrGenerator"; 
import {
  createCourse,
  deleteCourse,
  filterCourses,
  getCourses,
  getInitialCourseForm,
  toggleCourseStatus,
  toggleGpsRequirement, // Importado para la Geocerca
  updateCourse,
} from "../application/courseService";
import {
  buildCourseSchedule,
  DAYS,
  getCourseValidationMessage,
  HOURS_24,
  MINUTES,
} from "../domain/courseRules";
import { auth } from "../../../firebase/firebase";
import { getUserFromDB } from "../../auth-registro/infrastructure/FirebaseAuthRepository";

// Switch reutilizable con etiquetas dinámicas
const StatusSwitch = ({ checked, onChange, activeLabel = "Activo", inactiveLabel = "Inactivo" }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={checked ? `Desactivar` : `Activar`}
    className={`course-status-switch ${checked ? "is-active" : "is-inactive"}`}
    onClick={onChange}
  >
    <span className="course-status-switch__track">
      <span className="course-status-switch__thumb" />
    </span>
    <span className="course-status-switch__label">
      {checked ? activeLabel : inactiveLabel}
    </span>
  </button>
);

const buildTeacherName = (registeredUser, firebaseUser) => {
  const fullName = `${registeredUser?.nombres || ""} ${registeredUser?.apellidos || ""}`.trim();
  if (fullName) return fullName;
  if (firebaseUser?.displayName?.trim()) return firebaseUser.displayName.trim();
  return firebaseUser?.email || "";
};

const courseBelongsToTeacher = (course, teacher) => {
  if (!teacher?.uid) return false;
  const courseOwnerUid = course.teacherUid || course.docenteUid || course.ownerUid || course.createdBy || course.uid;
  if (courseOwnerUid) return courseOwnerUid === teacher.uid;
  const teacherName = teacher.nombre?.trim().toLowerCase();
  const courseTeacherName = course.docente?.trim().toLowerCase();
  return teacherName && courseTeacherName ? teacherName === courseTeacherName : false;
};

const CoursesSection = () => {
  const [mostrar, setMostrar] = useState(5);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(getInitialCourseForm());
  const [paginaActual, setPaginaActual] = useState(1);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [selectedCourseForQr, setSelectedCourseForQr] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      if (!firebaseUser) {
        setCurrentTeacher(null);
        setCursos([]);
        setError("Debes iniciar sesion para gestionar cursos.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const registeredUser = await getUserFromDB(firebaseUser.uid);
        const teacher = {
          uid: firebaseUser.uid,
          email: registeredUser?.email || firebaseUser.email || "",
          nombre: buildTeacherName(registeredUser, firebaseUser),
          rol: registeredUser?.rol || "",
        };
        if (!isMounted) return;
        setCurrentTeacher(teacher);
        setForm((prev) => ({ ...prev, docente: teacher.nombre, teacherUid: teacher.uid, teacherEmail: teacher.email }));
        const data = await getCourses();
        if (isMounted) setCursos(data);
      } catch (loadError) {
        console.error(loadError);
        if (isMounted) setError("No se pudieron cargar los cursos del catedratico.");
      } finally {
        if (isMounted) setLoading(false);
      }
    });
    return () => { isMounted = false; unsubscribe(); };
  }, []);

  const cursosDelDocente = useMemo(() => cursos.filter((c) => courseBelongsToTeacher(c, currentTeacher)), [cursos, currentTeacher]);
  const cursosFiltrados = useMemo(() => filterCourses(cursosDelDocente, busqueda), [cursosDelDocente, busqueda]);
  const draftCourse = useMemo(() => buildCourseSchedule(form), [form]);
  const liveValidationMessage = useMemo(() => getCourseValidationMessage(draftCourse, cursos), [draftCourse, cursos]);

  const totalPaginas = Math.max(1, Math.ceil(cursosFiltrados.length / mostrar));
  const inicio = (paginaActual - 1) * mostrar;
  const cursosMostrados = cursosFiltrados.slice(inicio, inicio + mostrar);

  const abrirNuevo = () => {
    setEditando(false);
    setForm({ ...getInitialCourseForm(), docente: currentTeacher?.nombre || "", teacherUid: currentTeacher?.uid || "", teacherEmail: currentTeacher?.email || "", requiereGPS: false });
    setFormError("");
    setModalOpen(true);
  };

  const abrirEditar = (curso) => {
    const [hI, mI] = (curso.horaInicio || "").split(":");
    const [hF, mF] = (curso.horaFin || "").split(":");
    setEditando(true);
    setForm({ ...curso, dias: curso.dias || [], horaInicioHora: hI, horaInicioMinuto: mI, horaFinHora: hF, horaFinMinuto: mF });
    setFormError("");
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setForm({ ...getInitialCourseForm(), docente: currentTeacher?.nombre || "", teacherUid: currentTeacher?.uid || "", teacherEmail: currentTeacher?.email || "" });
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setFormError("");
  };

  const handleDayChange = (day) => {
    setForm((p) => ({ ...p, dias: p.dias.includes(day) ? p.dias.filter((d) => d !== day) : [...p.dias, day] }));
    setFormError("");
  };

  const handleSaveCourse = async () => {
    try {
      setFormError("");
      const payload = { ...form, docente: currentTeacher?.nombre || form.docente, teacherUid: currentTeacher?.uid || form.teacherUid, teacherEmail: currentTeacher?.email || form.teacherEmail };
      if (editando) {
        const updated = await updateCourse(payload, cursos);
        setCursos((p) => p.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createCourse(payload, cursos);
        setCursos((p) => [created, ...p]);
      }
      cerrarModal();
    } catch (err) { setFormError(err.message || "No se pudo guardar."); }
  };

  const handleDelete = async (course) => {
    if (!window.confirm("Deseas eliminar este curso?")) return;
    try {
      await deleteCourse(course);
      setCursos((p) => p.filter((item) => item.id !== course.id));
    } catch (err) { alert("Error al eliminar."); }
  };

  const handleToggleStatus = async (course) => {
    try {
      const updated = await toggleCourseStatus(course);
      setCursos((p) => p.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) { alert("Error al cambiar estado."); }
  };

  // Lógica para el toggle de Geocerca
  const handleToggleGps = async (course) => {
    try {
      await toggleGpsRequirement(course);
      // Actualizamos el estado local para que el switch cambie visualmente
      setCursos((p) => p.map((item) => 
        item.id === course.id ? { ...item, requiereGPS: !item.requiereGPS } : item
      ));
    } catch (err) { alert("Error al cambiar requerimiento de GPS."); }
  };

  return (
    <>
      {error && <div style={styles.errorBox}>{error}</div>}
      {currentTeacher?.nombre && <div style={styles.teacherBadge} className="responsive-inline-badge">Catedratico activo: {currentTeacher.nombre}</div>}

      <div style={styles.toolbar} className="responsive-stack-tablet responsive-gap-md">
        <button type="button" style={styles.primaryButton} className="responsive-button-full-mobile" onClick={abrirNuevo}>Nuevo Curso</button>
        <div style={styles.toolbarControls} className="responsive-toolbar-controls">
          <select value={mostrar} onChange={(e) => { setMostrar(Number(e.target.value)); setPaginaActual(1); }} style={styles.select} className="responsive-input">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
          <input placeholder="Buscar curso..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} style={styles.searchInput} className="responsive-input" />
        </div>
      </div>

      <div style={styles.card} className="responsive-card-shell">
        {loading ? <div style={styles.loading}>Cargando...</div> : (
          <>
            <div style={styles.tableContainer} className="responsive-table-scroll">
              <table style={styles.table} className="responsive-table courses-table">
                <thead>
                  <tr>
                    <th style={styles.th}>Curso</th>
                    <th style={styles.th}>Docente</th>
                    <th style={styles.th}>Aula</th>
                    <th style={styles.th}>Dias</th>
                    <th style={styles.th}>Horario</th>
                    <th style={styles.th}>Geocerca</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosMostrados.map((course) => (
                    <tr key={course.id}>
                      <td style={styles.td}><strong>{course.nombre}</strong><div style={styles.mutedText}>{course.codigo} - Sec. {course.seccion}</div></td>
                      <td style={styles.td}>{course.docente}</td>
                      <td style={styles.td}>{course.aula}</td>
                      <td style={styles.td}>{(course.dias || []).join(", ")}</td>
                      <td style={styles.td}>{course.horario}</td>
                      {/* Switch de Geocerca en la tabla */}
                      <td style={styles.td}>
                        <StatusSwitch 
                          checked={Boolean(course.requiereGPS)} 
                          onChange={() => handleToggleGps(course)} 
                          activeLabel="Sí" 
                          inactiveLabel="No"
                        />
                      </td>
                      <td style={styles.td}><StatusSwitch checked={Boolean(course.estado)} onChange={() => handleToggleStatus(course)} /></td>
                      <td style={styles.td}>
                        <div style={styles.actionRow} className="responsive-action-row">
                          <button
                            type="button"
                            title="Generar Código QR"
                            style={{ ...styles.smallButton, background: "#10b981", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}
                            onClick={() => setSelectedCourseForQr(course)}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                              <line x1="7" y1="7" x2="7.01" y2="7" /><line x1="17" y1="7" x2="17.01" y2="7" />
                              <line x1="7" y1="17" x2="7.01" y2="17" /><line x1="17" y1="17" x2="17.01" y2="17" />
                            </svg>
                          </button>
                          <button type="button" style={styles.smallButton} onClick={() => abrirEditar(course)}>Editar</button>
                          <button type="button" style={styles.deleteButton} onClick={() => handleDelete(course)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.footer} className="responsive-stack-tablet responsive-gap-md">
              <span style={styles.mutedText}>Mostrando {cursosFiltrados.length === 0 ? 0 : inicio + 1} a {Math.min(inicio + mostrar, cursosFiltrados.length)} de {cursosFiltrados.length}</span>
              <div style={styles.actionRow}>
                <button type="button" style={styles.smallButton} disabled={paginaActual === 1} onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}>Anterior</button>
                <span style={styles.pageIndicator}>{paginaActual}</span>
                <button type="button" style={styles.smallButton} disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal} className="responsive-modal">
            <h2 style={styles.modalTitle}>{editando ? "Editar Curso" : "Nuevo Curso"}</h2>
            <div style={styles.formGrid} className="responsive-form-grid">
              <div style={styles.field}><label style={styles.label}>Codigo</label><input name="codigo" value={form.codigo} onChange={handleChange} style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>Nombre</label><input name="nombre" value={form.nombre} onChange={handleChange} style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>Seccion</label><input name="seccion" value={form.seccion} onChange={handleChange} style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>Docente</label><input name="docente" value={form.docente} style={{ ...styles.input, ...styles.inputDisabled }} disabled readOnly /></div>
              <div style={styles.field}><label style={styles.label}>Aula</label><input name="aula" value={form.aula} onChange={handleChange} style={styles.input} /></div>
              
              {/* Switch de Geocerca en el Modal */}
              <div style={styles.field}>
                <label style={styles.label}>Geocerca (GPS)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusSwitch 
                    checked={Boolean(form.requiereGPS)} 
                    onChange={() => setForm(p => ({ ...p, requiereGPS: !p.requiereGPS }))} 
                    activeLabel="Activada" 
                    inactiveLabel="Desactivada"
                  />
                  <span style={styles.mutedText}>Exigir ubicación en sede</span>
                </div>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Dias</label>
              <div style={styles.daysGrid}>
                {DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => handleDayChange(d)} style={{ ...styles.dayButton, ...(form.dias.includes(d) ? styles.dayButtonActive : {}) }}>{d}</button>
                ))}
              </div>
            </div>
            <div style={styles.timeGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Hora inicio</label>
                <div style={styles.timeRow}>
                  <select name="horaInicioHora" value={form.horaInicioHora} onChange={handleChange} style={styles.select}>{HOURS_24.map(h => <option key={h} value={h}>{h}</option>)}</select>
                  <select name="horaInicioMinuto" value={form.horaInicioMinuto} onChange={handleChange} style={styles.select}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Hora fin</label>
                <div style={styles.timeRow}>
                  <select name="horaFinHora" value={form.horaFinHora} onChange={handleChange} style={styles.select}>{HOURS_24.map(h => <option key={h} value={h}>{h}</option>)}</select>
                  <select name="horaFinMinuto" value={form.horaFinMinuto} onChange={handleChange} style={styles.select}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
            </div>
            {(liveValidationMessage || formError) && <div style={styles.inlineError}>{formError || liveValidationMessage}</div>}
            <div style={styles.modalActions}>
              <button type="button" style={styles.smallButton} onClick={cerrarModal}>Cancelar</button>
              <button type="button" style={{ ...styles.primaryButton, ...(liveValidationMessage ? styles.primaryButtonDisabled : {}) }} onClick={handleSaveCourse} disabled={Boolean(liveValidationMessage)}>{editando ? "Actualizar" : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {selectedCourseForQr && <QrGenerator course={selectedCourseForQr} currentTeacher={currentTeacher} onClose={() => setSelectedCourseForQr(null)} />}
    </>
  );
};

// ... (Estilos se mantienen iguales)
const styles = {
  errorBox: { marginBottom: "18px", padding: "12px 16px", borderRadius: "12px", background: "#fee2e2", color: "#b91c1c" },
  teacherBadge: { marginBottom: "18px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "999px", background: "#e0f2fe", color: "#075985", fontWeight: "700" },
  toolbar: { display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "18px" },
  toolbarControls: { display: "flex", gap: "12px", flexWrap: "wrap" },
  primaryButton: { border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff", padding: "12px 18px", borderRadius: "12px", cursor: "pointer", fontWeight: "700" },
  smallButton: { border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a", padding: "10px 14px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
  deleteButton: { border: "none", background: "#dc2626", color: "#ffffff", padding: "10px 14px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
  searchInput: { border: "1px solid #cbd5e1", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", minWidth: "280px" },
  card: { background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)", overflow: "hidden" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "860px" },
  th: { textAlign: "left", padding: "16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569" },
  td: { padding: "16px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", verticalAlign: "top" },
  mutedText: { color: "#64748b", fontSize: "13px" },
  actionRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "16px", flexWrap: "wrap" },
  pageIndicator: { minWidth: "40px", textAlign: "center", fontWeight: "700", color: "#0f172a" },
  loading: { padding: "28px", color: "#334155" },
  emptyState: { padding: "30px", textAlign: "center", color: "#64748b" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", zIndex: 1000 },
  modal: { width: "100%", maxWidth: "840px", background: "#ffffff", borderRadius: "22px", padding: "24px", boxShadow: "0 25px 70px rgba(0, 0, 0, 0.28)" },
  modalTitle: { marginTop: 0, marginBottom: "20px", color: "#0f172a" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  label: { fontWeight: "700", color: "#334155" },
  input: { border: "1px solid #cbd5e1", borderRadius: "12px", padding: "12px 14px", fontSize: "14px" },
  inputDisabled: { background: "#f8fafc", color: "#475569", cursor: "not-allowed" },
  select: { border: "1px solid #cbd5e1", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", background: "#ffffff" },
  daysGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
  dayButton: { border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a", padding: "10px 14px", borderRadius: "999px", cursor: "pointer", fontWeight: "600" },
  dayButtonActive: { background: "#2563eb", color: "#ffffff", borderColor: "#2563eb" },
  timeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" },
  timeRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  summaryBox: { marginTop: "6px", marginBottom: "18px", padding: "12px 14px", borderRadius: "12px", background: "#eff6ff", color: "#1d4ed8", fontWeight: "600" },
  inlineError: { marginTop: "6px", marginBottom: "18px", padding: "12px 14px", borderRadius: "12px", background: "#fee2e2", color: "#b91c1c", fontWeight: "600" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" },
  primaryButtonDisabled: { opacity: 0.55, cursor: "not-allowed" },
};

export default CoursesSection;