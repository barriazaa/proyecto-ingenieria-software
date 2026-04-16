import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  createCourse,
  deleteCourse,
  filterCourses,
  getCourses,
  getInitialCourseForm,
  toggleCourseStatus,
  updateCourse,
} from "../application/courseService";
import {
  buildCourseSchedule,
  DAYS,
  getCourseStatusLabel,
  getCourseValidationMessage,
  HOURS_24,
  MINUTES,
} from "../domain/courseRules";
import { auth } from "../../../firebase/firebase";
import { getUserFromDB } from "../../auth-registro/infrastructure/FirebaseAuthRepository";

const buildTeacherName = (registeredUser, firebaseUser) => {
  const fullName = `${registeredUser?.nombres || ""} ${registeredUser?.apellidos || ""}`.trim();

  if (fullName) {
    return fullName;
  }

  if (firebaseUser?.displayName?.trim()) {
    return firebaseUser.displayName.trim();
  }

  return firebaseUser?.email || "";
};

const courseBelongsToTeacher = (course, teacher) => {
  if (!teacher?.uid) {
    return false;
  }

  const courseOwnerUid =
    course.teacherUid || course.docenteUid || course.ownerUid || course.createdBy || course.uid;

  if (courseOwnerUid) {
    return courseOwnerUid === teacher.uid;
  }

  const teacherName = teacher.nombre?.trim().toLowerCase();
  const courseTeacherName = course.docente?.trim().toLowerCase();

  if (teacherName && courseTeacherName) {
    return teacherName === courseTeacherName;
  }

  return false;
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

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) {
        return;
      }

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

        if (!isMounted) {
          return;
        }

        setCurrentTeacher(teacher);
        setForm((prev) => ({
          ...prev,
          docente: teacher.nombre,
          teacherUid: teacher.uid,
          teacherEmail: teacher.email,
        }));

        const data = await getCourses();

        if (!isMounted) {
          return;
        }

        setCursos(data);
      } catch (loadError) {
        console.error(loadError);
        if (isMounted) {
          setError("No se pudieron cargar los cursos del catedratico.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const cursosDelDocente = useMemo(
    () => cursos.filter((course) => courseBelongsToTeacher(course, currentTeacher)),
    [cursos, currentTeacher]
  );
  const cursosFiltrados = useMemo(
    () => filterCourses(cursosDelDocente, busqueda),
    [cursosDelDocente, busqueda]
  );
  const draftCourse = useMemo(() => buildCourseSchedule(form), [form]);
  const liveValidationMessage = useMemo(
    () => getCourseValidationMessage(draftCourse, cursos),
    [draftCourse, cursos]
  );

  const totalPaginas = Math.max(1, Math.ceil(cursosFiltrados.length / mostrar));
  const inicio = (paginaActual - 1) * mostrar;
  const cursosMostrados = cursosFiltrados.slice(inicio, inicio + mostrar);

  const abrirNuevo = () => {
    setEditando(false);
    setForm({
      ...getInitialCourseForm(),
      docente: currentTeacher?.nombre || "",
      teacherUid: currentTeacher?.uid || "",
      teacherEmail: currentTeacher?.email || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const abrirEditar = (curso) => {
    const [horaInicioHora = "", horaInicioMinuto = "00"] = (curso.horaInicio || "").split(":");
    const [horaFinHora = "", horaFinMinuto = "00"] = (curso.horaFin || "").split(":");

    setEditando(true);
    setForm({
      ...curso,
      dias: curso.dias || [],
      horaInicioHora,
      horaInicioMinuto,
      horaFinHora,
      horaFinMinuto,
      docente: currentTeacher?.nombre || curso.docente || "",
      teacherUid: currentTeacher?.uid || curso.teacherUid || curso.docenteUid || curso.ownerUid || "",
      teacherEmail: currentTeacher?.email || curso.teacherEmail || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setForm({
      ...getInitialCourseForm(),
      docente: currentTeacher?.nombre || "",
      teacherUid: currentTeacher?.uid || "",
      teacherEmail: currentTeacher?.email || "",
    });
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormError("");
  };

  const handleDayChange = (day) => {
    setForm((prev) => {
      const exists = prev.dias.includes(day);

      return {
        ...prev,
        dias: exists ? prev.dias.filter((item) => item !== day) : [...prev.dias, day],
      };
    });
    setFormError("");
  };

  const handleSaveCourse = async () => {
    try {
      setFormError("");
      const coursePayload = {
        ...form,
        docente: currentTeacher?.nombre || form.docente,
        teacherUid: currentTeacher?.uid || form.teacherUid,
        teacherEmail: currentTeacher?.email || form.teacherEmail,
      };

      if (editando) {
        const updatedCourse = await updateCourse(coursePayload, cursos);
        setCursos((prev) =>
          prev.map((course) => (course.id === updatedCourse.id ? updatedCourse : course))
        );
      } else {
        const createdCourse = await createCourse(coursePayload, cursos);
        setCursos((prev) => [createdCourse, ...prev]);
      }

      cerrarModal();
    } catch (saveError) {
      console.error(saveError);
      setFormError(saveError.message || "No se pudo guardar el curso.");
    }
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm("Deseas eliminar este curso?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteCourse(course);
      setCursos((prev) => prev.filter((item) => item.id !== course.id));
    } catch (deleteError) {
      console.error(deleteError);
      alert("No se pudo eliminar el curso.");
    }
  };

  const handleToggleStatus = async (course) => {
    try {
      const updatedCourse = await toggleCourseStatus(course);
      setCursos((prev) =>
        prev.map((item) => (item.id === updatedCourse.id ? updatedCourse : item))
      );
    } catch (toggleError) {
      console.error(toggleError);
      alert("No se pudo cambiar el estado del curso.");
    }
  };

  return (
    <>
      {error && <div style={styles.errorBox}>{error}</div>}

      {currentTeacher?.nombre && (
        <div style={styles.teacherBadge}>Catedratico activo: {currentTeacher.nombre}</div>
      )}

      <div style={styles.toolbar}>
        <button type="button" style={styles.primaryButton} onClick={abrirNuevo}>
          Nuevo Curso
        </button>

        <div style={styles.toolbarControls}>
          <select
            value={mostrar}
            onChange={(e) => {
              setMostrar(Number(e.target.value));
              setPaginaActual(1);
            }}
            style={styles.select}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>

          <input
            placeholder="Buscar por curso, docente, aula o dia"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Cargando cursos...</div>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Curso</th>
                    <th style={styles.th}>Docente</th>
                    <th style={styles.th}>Aula</th>
                    <th style={styles.th}>Dias</th>
                    <th style={styles.th}>Horario</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosMostrados.length > 0 ? (
                    cursosMostrados.map((course) => (
                      <tr key={course.id}>
                        <td style={styles.td}>
                          <strong>{course.nombre}</strong>
                          <div style={styles.mutedText}>
                            {course.codigo} - Seccion {course.seccion}
                          </div>
                        </td>
                        <td style={styles.td}>{course.docente}</td>
                        <td style={styles.td}>{course.aula}</td>
                        <td style={styles.td}>{(course.dias || []).join(", ")}</td>
                        <td style={styles.td}>{course.horario}</td>
                        <td style={styles.td}>{getCourseStatusLabel(course.estado)}</td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button
                              type="button"
                              style={styles.smallButton}
                              onClick={() => abrirEditar(course)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              style={styles.smallButton}
                              onClick={() => handleToggleStatus(course)}
                            >
                              Estado
                            </button>
                            <button
                              type="button"
                              style={styles.deleteButton}
                              onClick={() => handleDelete(course)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={styles.emptyState}>
                        No hay cursos que coincidan con la busqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.footer}>
              <span style={styles.mutedText}>
                Mostrando {cursosFiltrados.length === 0 ? 0 : inicio + 1} a{" "}
                {Math.min(inicio + mostrar, cursosFiltrados.length)} de {cursosFiltrados.length}{" "}
                registros
              </span>

              <div style={styles.actionRow}>
                <button
                  type="button"
                  style={styles.smallButton}
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </button>
                <span style={styles.pageIndicator}>{paginaActual}</span>
                <button
                  type="button"
                  style={styles.smallButton}
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{editando ? "Editar Curso" : "Nuevo Curso"}</h2>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Codigo</label>
                <input name="codigo" value={form.codigo} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Seccion</label>
                <input name="seccion" value={form.seccion} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Docente</label>
                <input
                  name="docente"
                  value={form.docente}
                  onChange={handleChange}
                  style={{ ...styles.input, ...styles.inputDisabled }}
                  disabled
                  readOnly
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Aula</label>
                <input name="aula" value={form.aula} onChange={handleChange} style={styles.input} />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Dias del curso</label>
              <div style={styles.daysGrid}>
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayChange(day)}
                    style={{
                      ...styles.dayButton,
                      ...(form.dias.includes(day) ? styles.dayButtonActive : {}),
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.timeGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Hora inicio</label>
                <div style={styles.timeRow}>
                  <select
                    name="horaInicioHora"
                    value={form.horaInicioHora}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="">Hora</option>
                    {HOURS_24.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    name="horaInicioMinuto"
                    value={form.horaInicioMinuto}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    {MINUTES.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Hora fin</label>
                <div style={styles.timeRow}>
                  <select
                    name="horaFinHora"
                    value={form.horaFinHora}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="">Hora</option>
                    {HOURS_24.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    name="horaFinMinuto"
                    value={form.horaFinMinuto}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    {MINUTES.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.summaryBox}>
              Franja seleccionada:{" "}
              {form.horaInicioHora ? `${form.horaInicioHora}:${form.horaInicioMinuto}` : "--:--"} a{" "}
              {form.horaFinHora ? `${form.horaFinHora}:${form.horaFinMinuto}` : "--:--"}
            </div>

            {(liveValidationMessage || formError) && (
              <div style={styles.inlineError}>{formError || liveValidationMessage}</div>
            )}

            <div style={styles.modalActions}>
              <button type="button" style={styles.smallButton} onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                type="button"
                style={{
                  ...styles.primaryButton,
                  ...(liveValidationMessage ? styles.primaryButtonDisabled : {}),
                }}
                onClick={handleSaveCourse}
                disabled={Boolean(liveValidationMessage)}
              >
                {editando ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  errorBox: {
    marginBottom: "18px",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#fee2e2",
    color: "#b91c1c",
  },
  teacherBadge: {
    marginBottom: "18px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#075985",
    fontWeight: "700",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  toolbarControls: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  smallButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },
  deleteButton: {
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },
  searchInput: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    minWidth: "280px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "16px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
  },
  td: {
    padding: "16px",
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a",
    verticalAlign: "top",
  },
  mutedText: {
    color: "#64748b",
    fontSize: "13px",
  },
  actionRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    flexWrap: "wrap",
  },
  pageIndicator: {
    minWidth: "40px",
    textAlign: "center",
    fontWeight: "700",
    color: "#0f172a",
  },
  loading: {
    padding: "28px",
    color: "#334155",
  },
  emptyState: {
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: "840px",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 25px 70px rgba(0, 0, 0, 0.28)",
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#0f172a",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  label: {
    fontWeight: "700",
    color: "#334155",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
  },
  inputDisabled: {
    background: "#f8fafc",
    color: "#475569",
    cursor: "not-allowed",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    background: "#ffffff",
  },
  daysGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  dayButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "600",
  },
  dayButtonActive: {
    background: "#2563eb",
    color: "#ffffff",
    borderColor: "#2563eb",
  },
  timeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px",
  },
  timeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  summaryBox: {
    marginTop: "6px",
    marginBottom: "18px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "600",
  },
  inlineError: {
    marginTop: "6px",
    marginBottom: "18px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: "600",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButtonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};

export default CoursesSection;
