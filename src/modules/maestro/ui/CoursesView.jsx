import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  filterCourses,
  getInitialCourseForm,
  getInitialCourses,
  removeCourse,
  saveCourse,
  toggleCourseStatus,
} from "../application/courseService";
import { getCourseStatusLabel } from "../domain/courseRules";
import { ROUTES } from "../../../shared/utils/routePaths";

const CoursesView = () => {
  const navigate = useNavigate();
  const initialForm = getInitialCourseForm();

  const [periodo, setPeriodo] = useState("2025");
  const [mostrar, setMostrar] = useState(5);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cursos, setCursos] = useState(getInitialCourses());

  const cursosFiltrados = useMemo(
    () => filterCourses(cursos, busqueda),
    [cursos, busqueda]
  );

  const totalPaginas = Math.ceil(cursosFiltrados.length / mostrar) || 1;
  const inicio = (paginaActual - 1) * mostrar;
  const fin = inicio + mostrar;
  const cursosMostrados = cursosFiltrados.slice(inicio, fin);

  const abrirNuevo = () => {
    setEditando(false);
    setForm(getInitialCourseForm());
    setModalOpen(true);
  };

  const abrirEditar = (curso) => {
    setEditando(true);
    setForm(curso);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setForm(getInitialCourseForm());
    setEditando(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const guardarCurso = () => {
    try {
      const updatedCourses = saveCourse({
        courses: cursos,
        form,
        isEditing: editando,
      });
      setCursos(updatedCourses);
      cerrarModal();
    } catch (error) {
      alert(error.message);
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowOne}></div>
      <div style={styles.backgroundGlowTwo}></div>

      <div style={styles.wrapper}>
        <div style={styles.headerTop}>
          <div>
            <span style={styles.sectionLabel}>Panel academico</span>
            <h1 style={styles.pageTitle}>Gestion de Cursos</h1>
            <p style={styles.pageSubtitle}>
              Administra los cursos asignados al maestro de manera clara, ordenada y profesional.
            </p>
          </div>

          <div style={styles.periodoContainer}>
            <label style={styles.periodoTitle}>Periodo academico</label>
            <div style={styles.periodoBox}>
              <span style={styles.periodoLabel}>Periodo</span>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                style={styles.periodoSelect}
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
        </div>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryTitle}>Cursos registrados</span>
            <strong style={styles.summaryValue}>{cursos.length}</strong>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryTitle}>Cursos activos</span>
            <strong style={styles.summaryValue}>
              {cursos.filter((c) => c.estado).length}
            </strong>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryTitle}>Resultados filtrados</span>
            <strong style={styles.summaryValue}>{cursosFiltrados.length}</strong>
          </div>
        </div>

        <div style={styles.topBar}>
          <button style={styles.backButton} onClick={() => navigate(ROUTES.home)}>
            Regresar al panel
          </button>

          <button style={styles.newButtonLarge} onClick={abrirNuevo}>
            Nuevo Curso
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Listado de Cursos</h2>
              <p style={styles.cardSubtitle}>
                Visualiza, busca, edita y administra los cursos disponibles.
              </p>
            </div>
          </div>

          <div style={styles.filtersRow}>
            <div style={styles.leftFilters}>
              <span style={styles.filterText}>Mostrar</span>
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
              <span style={styles.filterText}>registros</span>
            </div>

            <div style={styles.searchBox}>
              <label style={styles.searchLabel}>Buscar</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                style={styles.searchInput}
                placeholder="Codigo, curso, seccion o docente"
              />
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Codigo</th>
                  <th style={styles.th}>Curso</th>
                  <th style={styles.th}>Seccion</th>
                  <th style={styles.th}>Docente</th>
                  <th style={styles.th}>Horario</th>
                  <th style={styles.th}>Aula</th>
                  <th style={styles.thCenter}>Estado</th>
                  <th style={styles.thCenter}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cursosMostrados.length > 0 ? (
                  cursosMostrados.map((curso, index) => (
                    <tr key={curso.id} style={styles.tr}>
                      <td style={styles.td}>{inicio + index + 1}</td>
                      <td style={styles.tdCode}>{curso.codigo}</td>
                      <td style={styles.tdStrong}>{curso.nombre}</td>
                      <td style={styles.td}>{curso.seccion}</td>
                      <td style={styles.td}>{curso.docente}</td>
                      <td style={styles.td}>{curso.horario}</td>
                      <td style={styles.td}>{curso.aula}</td>
                      <td style={styles.tdCenter}>
                        <button
                          onClick={() => setCursos((prev) => toggleCourseStatus(prev, curso.id))}
                          style={{
                            ...styles.statusButton,
                            backgroundColor: curso.estado ? "#22c55e" : "#64748b",
                          }}
                        >
                          <span style={styles.statusDot}></span>
                          {getCourseStatusLabel(curso.estado)}
                        </button>
                      </td>
                      <td style={styles.tdCenter}>
                        <div style={styles.actionButtons}>
                          <button
                            style={{ ...styles.iconButton, ...styles.editButton }}
                            onClick={() => abrirEditar(curso)}
                            title="Editar"
                          >
                            Ed
                          </button>

                          <button
                            style={{ ...styles.iconButton, ...styles.deleteButton }}
                            onClick={() => {
                              if (!window.confirm("Deseas eliminar este curso?")) return;
                              setCursos((prev) => removeCourse(prev, curso.id));
                            }}
                            title="Eliminar"
                          >
                            El
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={styles.noData}>
                      No se encontraron cursos con los criterios ingresados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.footer}>
            <span style={styles.footerText}>
              Mostrando {cursosFiltrados.length === 0 ? 0 : inicio + 1} a{" "}
              {Math.min(fin, cursosFiltrados.length)} de {cursosFiltrados.length} registros
            </span>

            <div style={styles.pagination}>
              <button
                style={{
                  ...styles.pageButton,
                  ...(paginaActual === 1 ? styles.pageButtonDisabled : {}),
                }}
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>

              <button style={styles.pageButtonActive}>{paginaActual}</button>

              <button
                style={{
                  ...styles.pageButton,
                  ...(paginaActual === totalPaginas ? styles.pageButtonDisabled : {}),
                }}
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{editando ? "Editar Curso" : "Nuevo Curso"}</h3>
                <p style={styles.modalSubtitle}>
                  Completa la informacion correspondiente del curso.
                </p>
              </div>

              <button style={styles.modalClose} onClick={cerrarModal}>
                X
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Codigo</label>
                <input
                  type="text"
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej. SIS-101"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Curso</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Nombre del curso"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Seccion</label>
                <input
                  type="text"
                  name="seccion"
                  value={form.seccion}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej. A"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Docente</label>
                <input
                  type="text"
                  name="docente"
                  value={form.docente}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Nombre del docente"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Horario</label>
                <input
                  type="text"
                  name="horario"
                  value={form.horario}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej. 07:00 - 08:30"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Aula</label>
                <input
                  type="text"
                  name="aula"
                  value={form.aula}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ej. Laboratorio 1"
                />
              </div>
            </div>

            <div style={styles.checkRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="estado"
                  checked={form.estado}
                  onChange={handleChange}
                />
                Curso activo
              </label>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelButton} onClick={cerrarModal}>
                Cancelar
              </button>
              <button style={styles.saveButton} onClick={guardarCurso}>
                {editando ? "Actualizar curso" : "Guardar curso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 45%, #ecfeff 100%)",
    padding: "36px 20px 48px",
    fontFamily: "Arial, sans-serif",
  },
  backgroundGlowOne: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(37, 99, 235, 0.10)",
    top: "-80px",
    right: "-80px",
    filter: "blur(30px)",
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background: "rgba(6, 182, 212, 0.10)",
    bottom: "20px",
    left: "-50px",
    filter: "blur(30px)",
  },
  wrapper: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1280px",
    margin: "0 auto",
  },
  sectionLabel: {
    display: "inline-block",
    marginBottom: "10px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: "40px",
    color: "#0f172a",
    fontWeight: "800",
    letterSpacing: "-1px",
  },
  pageSubtitle: {
    margin: "10px 0 0 0",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: "1.6",
    maxWidth: "720px",
  },
  periodoContainer: {
    minWidth: "260px",
  },
  periodoTitle: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "700",
  },
  periodoBox: {
    display: "flex",
    alignItems: "center",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  periodoLabel: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: "700",
  },
  periodoSelect: {
    padding: "13px 14px",
    border: "none",
    minWidth: "180px",
    outline: "none",
    backgroundColor: "#fff",
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "600",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    borderRadius: "20px",
    padding: "20px 22px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
  },
  summaryTitle: {
    display: "block",
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "28px",
    color: "#0f172a",
    fontWeight: "800",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
    gap: "14px",
    flexWrap: "wrap",
  },
  backButton: {
    border: "1px solid #bae6fd",
    backgroundColor: "#ffffff",
    color: "#0f766e",
    padding: "12px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  },
  newButtonLarge: {
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 12px 24px rgba(8, 145, 178, 0.22)",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(10px)",
  },
  cardHeader: {
    padding: "24px 28px 18px",
    borderBottom: "1px solid #eef2f7",
  },
  cardTitle: {
    margin: 0,
    fontSize: "30px",
    color: "#0f172a",
    fontWeight: "800",
  },
  cardSubtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  filtersRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 28px",
    flexWrap: "wrap",
    gap: "14px",
  },
  leftFilters: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterText: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: "600",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    outline: "none",
    backgroundColor: "#fff",
    fontWeight: "600",
    color: "#0f172a",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchLabel: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: "700",
  },
  searchInput: {
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "12px 15px",
    width: "290px",
    outline: "none",
    backgroundColor: "#fff",
    fontSize: "14px",
    color: "#0f172a",
  },
  tableContainer: {
    overflowX: "auto",
    padding: "0 28px 24px 28px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 12px",
    fontSize: "14px",
    minWidth: "1050px",
  },
  th: {
    textAlign: "left",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "800",
    padding: "0 14px 8px 14px",
  },
  thCenter: {
    textAlign: "center",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "800",
    padding: "0 14px 8px 14px",
  },
  tr: {
    backgroundColor: "#ffffff",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },
  td: {
    padding: "16px 14px",
    color: "#334155",
    verticalAlign: "middle",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
  },
  tdCode: {
    padding: "16px 14px",
    color: "#1d4ed8",
    fontWeight: "800",
    verticalAlign: "middle",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
  },
  tdStrong: {
    padding: "16px 14px",
    color: "#0f172a",
    fontWeight: "700",
    verticalAlign: "middle",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
  },
  tdCenter: {
    padding: "16px 14px",
    textAlign: "center",
    verticalAlign: "middle",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
  },
  noData: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
    fontWeight: "600",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 28px 24px 28px",
    flexWrap: "wrap",
    gap: "12px",
  },
  footerText: {
    fontSize: "14px",
    color: "#475569",
    fontWeight: "600",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pageButton: {
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    color: "#334155",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  pageButtonDisabled: {
    backgroundColor: "#f8fafc",
    color: "#9ca3af",
    cursor: "not-allowed",
  },
  pageButtonActive: {
    border: "1px solid #2563eb",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "10px",
    fontWeight: "700",
  },
  statusButton: {
    border: "none",
    color: "#ffffff",
    padding: "8px 14px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: "110px",
    justifyContent: "center",
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
    backgroundColor: "#ffffff",
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
  },
  iconButton: {
    border: "none",
    color: "#ffffff",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  editButton: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  },
  deleteButton: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    width: "100%",
    maxWidth: "760px",
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.28)",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "22px 26px",
    borderBottom: "1px solid #e5e7eb",
    gap: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "26px",
    color: "#0f172a",
    fontWeight: "800",
  },
  modalSubtitle: {
    margin: "6px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  modalClose: {
    border: "none",
    background: "#f8fafc",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    fontSize: "18px",
    cursor: "pointer",
    color: "#64748b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    padding: "26px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 13px",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  checkRow: {
    padding: "0 26px 20px 26px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontWeight: "600",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px 26px 26px 26px",
    borderTop: "1px solid #e5e7eb",
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
    color: "#111827",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  saveButton: {
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default CoursesView;
