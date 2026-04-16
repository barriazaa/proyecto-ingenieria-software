import { useEffect, useMemo, useState } from "react";
import { getCourses } from "../../cursos/application/courseService";

const getStudentFullName = (student) => student?.nombre || "Sin nombre";

const normalizeCourseAssignments = (student) => {
  const candidateAssignments =
    student?.cursosAsignados ||
    student?.courses ||
    student?.assignedCourses ||
    student?.courseIds ||
    [];

  if (!Array.isArray(candidateAssignments)) {
    return [];
  }

  return candidateAssignments.map((course) =>
    typeof course === "string" ? course : course.id || course.courseId
  );
};

const resolveAssignedCourses = (student, allCourses, assignedCourseIds) => {
  const explicitAssignments = allCourses.filter((course) => assignedCourseIds.includes(course.id));

  if (explicitAssignments.length > 0) {
    return explicitAssignments;
  }

  const embeddedAssignments =
    student?.cursosAsignados?.filter?.((course) => typeof course === "object") ||
    student?.assignedCourses?.filter?.((course) => typeof course === "object") ||
    [];

  if (embeddedAssignments.length > 0) {
    return embeddedAssignments;
  }

  return [];
};

const buildStatusPillStyle = (estado) => ({
  ...styles.statusPill,
  ...(estado === "Activo" ? styles.statusActive : styles.statusInactive),
});

const StudentMetricCard = ({ label, value, accent }) => (
  <div style={{ ...styles.metricCard, borderColor: accent }}>
    <span style={styles.metricLabel}>{label}</span>
    <strong style={{ ...styles.metricValue, color: accent }}>{value}</strong>
  </div>
);

const StudentRow = ({ student, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(student.id)}
    style={{
      ...styles.studentRow,
      ...(selected ? styles.studentRowSelected : {}),
    }}
  >
    <div style={styles.studentRowTop}>
      <strong style={styles.studentRowName}>{student.nombre}</strong>
      <span style={buildStatusPillStyle(student.estado)}>{student.estado}</span>
    </div>
    <span style={styles.studentRowMeta}>{student.correo}</span>
    <span style={styles.studentRowMeta}>Carnet {student.carnet}</span>
  </button>
);

const FieldEditor = ({ label, value, onChange }) => (
  <label style={styles.editorField}>
    <span style={styles.editorLabel}>{label}</span>
    <input value={value} onChange={onChange} style={styles.editorInput} />
  </label>
);

const DetailLine = ({ label, value, valueNode = null }) => (
  <div style={styles.detailLine}>
    <span style={styles.detailLabel}>{label}</span>
    {valueNode || <span style={styles.detailValue}>{value}</span>}
  </div>
);

const EstudiantesTable = ({ estudiantes }) => {
  const [studentsState, setStudentsState] = useState(estudiantes);
  const [selectedStudentId, setSelectedStudentId] = useState(estudiantes[0]?.id || "");
  const [allCourses, setAllCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [courseAssignments, setCourseAssignments] = useState({});
  const [selectedCourseToAssign, setSelectedCourseToAssign] = useState("");

  useEffect(() => {
    setStudentsState(estudiantes);
    setSelectedStudentId((currentId) => {
      if (currentId && estudiantes.some((student) => student.id === currentId)) {
        return currentId;
      }

      return estudiantes[0]?.id || "";
    });

    setCourseAssignments(
      estudiantes.reduce((accumulator, student) => {
        accumulator[student.id] = normalizeCourseAssignments(student);
        return accumulator;
      }, {})
    );
  }, [estudiantes]);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        setCoursesError("");
        const data = await getCourses();

        if (isMounted) {
          setAllCourses(data);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setCoursesError("No se pudieron cargar los cursos para esta vista.");
        }
      } finally {
        if (isMounted) {
          setCoursesLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedStudent =
    studentsState.find((student) => student.id === selectedStudentId) || studentsState[0] || null;

  const assignedCourseIds = selectedStudent
    ? courseAssignments[selectedStudent.id] || []
    : [];

  const assignedCourses = useMemo(() => {
    if (!selectedStudent) {
      return [];
    }

    return resolveAssignedCourses(selectedStudent, allCourses, assignedCourseIds);
  }, [allCourses, assignedCourseIds, selectedStudent]);

  const availableCourses = useMemo(
    () => allCourses.filter((course) => !assignedCourseIds.includes(course.id)),
    [allCourses, assignedCourseIds]
  );

  const handleStudentFieldChange = (field, value) => {
    setStudentsState((currentStudents) =>
      currentStudents.map((student) =>
        student.id === selectedStudentId ? { ...student, [field]: value } : student
      )
    );
  };

  const handleToggleStatus = () => {
    if (!selectedStudent) {
      return;
    }

    handleStudentFieldChange(
      "estado",
      selectedStudent.estado === "Activo" ? "Inactivo" : "Activo"
    );
  };

  const handleAssignCourse = () => {
    if (!selectedStudent || !selectedCourseToAssign) {
      return;
    }

    setCourseAssignments((currentAssignments) => {
      const studentAssignments = currentAssignments[selectedStudent.id] || [];

      if (studentAssignments.includes(selectedCourseToAssign)) {
        return currentAssignments;
      }

      return {
        ...currentAssignments,
        [selectedStudent.id]: [...studentAssignments, selectedCourseToAssign],
      };
    });

    setSelectedCourseToAssign("");
  };

  const handleRemoveCourse = (courseId) => {
    if (!selectedStudent) {
      return;
    }

    setCourseAssignments((currentAssignments) => ({
      ...currentAssignments,
      [selectedStudent.id]: (currentAssignments[selectedStudent.id] || []).filter(
        (assignedId) => assignedId !== courseId
      ),
    }));
  };

  if (studentsState.length === 0) {
    return <p style={styles.emptyMessage}>No hay estudiantes registrados.</p>;
  }

  const totalAssignedCourses = assignedCourses.length;

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sectionBadge}>Estudiantes</span>
          <h3 style={styles.sidebarTitle}>Listado activo</h3>
          <p style={styles.sidebarText}>
            Selecciona un estudiante para revisar su ficha y sus cursos en la misma vista.
          </p>
        </div>

        <div style={styles.studentList}>
          {studentsState.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              selected={student.id === selectedStudent?.id}
              onSelect={setSelectedStudentId}
            />
          ))}
        </div>
      </aside>

      <section style={styles.content}>
        {selectedStudent && (
          <>
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <div>
                  <span style={styles.sectionBadge}>Detalle del estudiante</span>
                  <h3 style={styles.detailTitle}>{getStudentFullName(selectedStudent)}</h3>
                  <p style={styles.detailSubtitle}>
                    Panel maestro con informacion editable y resumen academico del estudiante.
                  </p>
                </div>

                <button type="button" onClick={handleToggleStatus} style={styles.statusToggle}>
                  Cambiar a {selectedStudent.estado === "Activo" ? "Inactivo" : "Activo"}
                </button>
              </div>

              <div style={styles.metricsGrid}>
                <StudentMetricCard label="Carnet" value={selectedStudent.carnet} accent="#2563eb" />
                <StudentMetricCard label="Estado" value={selectedStudent.estado} accent="#14b8a6" />
                <StudentMetricCard
                  label="Cursos asignados"
                  value={String(totalAssignedCourses)}
                  accent="#f97316"
                />
              </div>

              <div style={styles.detailGrid}>
                <div style={styles.detailPanel}>
                  <h4 style={styles.panelTitle}>Ficha general</h4>
                  <div style={styles.detailList}>
                    <DetailLine label="Nombre completo" value={selectedStudent.nombre} />
                    <DetailLine label="Carnet" value={selectedStudent.carnet} />
                    <DetailLine label="Correo" value={selectedStudent.correo} />
                    <DetailLine
                      label="Estado"
                      valueNode={
                        <span style={buildStatusPillStyle(selectedStudent.estado)}>
                          {selectedStudent.estado}
                        </span>
                      }
                    />
                    <DetailLine label="Cantidad de cursos" value={String(totalAssignedCourses)} />
                  </div>
                </div>

                <div style={styles.detailPanel}>
                  <h4 style={styles.panelTitle}>Edicion rapida</h4>
                  <div style={styles.editorGrid}>
                    <FieldEditor
                      label="Nombre completo"
                      value={selectedStudent.nombre}
                      onChange={(event) =>
                        handleStudentFieldChange("nombre", event.target.value)
                      }
                    />
                    <FieldEditor
                      label="Carnet"
                      value={selectedStudent.carnet}
                      onChange={(event) =>
                        handleStudentFieldChange("carnet", event.target.value)
                      }
                    />
                  </div>

                  <div style={styles.statusEditor}>
                    <div>
                      <span style={styles.editorLabel}>Estado</span>
                      <p style={styles.statusHelper}>
                        Cambia rapidamente la disponibilidad del estudiante en el panel.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      style={{
                        ...styles.toggleShell,
                        ...(selectedStudent.estado === "Activo"
                          ? styles.toggleShellActive
                          : styles.toggleShellInactive),
                      }}
                    >
                      <span
                        style={{
                          ...styles.toggleKnob,
                          ...(selectedStudent.estado === "Activo"
                            ? styles.toggleKnobActive
                            : {}),
                        }}
                      />
                      <span style={styles.toggleText}>{selectedStudent.estado}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.courseCard}>
              <div style={styles.courseHeader}>
                <div>
                  <span style={styles.sectionBadge}>Cursos asignados</span>
                  <h3 style={styles.courseTitle}>Listado academico</h3>
                  <p style={styles.courseSubtitle}>
                    Consulta la asignacion actual y agrega cursos visibles en el sistema.
                  </p>
                </div>

                <div style={styles.assignBox}>
                  <select
                    value={selectedCourseToAssign}
                    onChange={(event) => setSelectedCourseToAssign(event.target.value)}
                    style={styles.assignSelect}
                    disabled={coursesLoading || availableCourses.length === 0}
                  >
                    <option value="">Asignar nuevo curso</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.nombre} - {course.seccion}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAssignCourse} style={styles.assignButton}>
                    Asignar
                  </button>
                </div>
              </div>

              {coursesError && <div style={styles.warningBox}>{coursesError}</div>}

              {coursesLoading ? (
                <div style={styles.loadingBox}>Cargando cursos disponibles...</div>
              ) : assignedCourses.length > 0 ? (
                <div style={styles.courseTableWrap}>
                  <table style={styles.courseTable}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Nombre del curso</th>
                        <th style={styles.th}>Seccion</th>
                        <th style={styles.th}>Horario</th>
                        <th style={styles.th}>Dias</th>
                        <th style={styles.th}>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedCourses.map((course) => (
                        <tr key={course.id || `${course.nombre}-${course.seccion}`}>
                          <td style={styles.td}>{course.nombre || "Curso sin nombre"}</td>
                          <td style={styles.td}>{course.seccion || "Sin seccion"}</td>
                          <td style={styles.td}>{course.horario || "Sin horario"}</td>
                          <td style={styles.td}>
                            {Array.isArray(course.dias) && course.dias.length > 0
                              ? course.dias.join(", ")
                              : "Sin dias"}
                          </td>
                          <td style={styles.td}>
                            {course.id ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveCourse(course.id)}
                                style={styles.removeButton}
                              >
                                Quitar
                              </button>
                            ) : (
                              <span style={styles.inlineHint}>Vista integrada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyCourses}>
                  Este estudiante todavia no tiene cursos asignados en la vista actual.
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

const styles = {
  layout: {
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: "22px",
    alignItems: "start",
  },
  sidebar: {
    background: "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 16px 36px rgba(148, 163, 184, 0.14)",
  },
  sidebarHeader: {
    marginBottom: "18px",
  },
  sectionBadge: {
    display: "inline-flex",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "12px",
  },
  sidebarTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "24px",
  },
  sidebarText: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#64748b",
    lineHeight: "1.6",
    fontSize: "14px",
  },
  studentList: {
    display: "grid",
    gap: "12px",
  },
  studentRow: {
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "16px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(148, 163, 184, 0.08)",
  },
  studentRowSelected: {
    borderColor: "#60a5fa",
    boxShadow: "0 0 0 4px rgba(96, 165, 250, 0.14)",
    background: "#f8fbff",
  },
  studentRowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "8px",
  },
  studentRowName: {
    color: "#0f172a",
    fontSize: "15px",
  },
  studentRowMeta: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  content: {
    display: "grid",
    gap: "22px",
  },
  detailCard: {
    background: "#ffffff",
    borderRadius: "26px",
    padding: "26px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  detailTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "30px",
  },
  detailSubtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#64748b",
    lineHeight: "1.6",
  },
  statusToggle: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "12px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },
  metricCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: "20px",
    padding: "18px",
    border: "1px solid #e2e8f0",
  },
  metricLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "8px",
  },
  metricValue: {
    fontSize: "26px",
    fontWeight: "800",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  detailPanel: {
    background: "#f8fbff",
    border: "1px solid #e0ecff",
    borderRadius: "22px",
    padding: "20px",
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#0f172a",
    fontSize: "18px",
  },
  detailList: {
    display: "grid",
    gap: "12px",
  },
  detailLine: {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: "12px",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid #e6edf7",
  },
  detailLabel: {
    color: "#64748b",
    fontWeight: "600",
  },
  detailValue: {
    color: "#0f172a",
    fontWeight: "700",
  },
  editorGrid: {
    display: "grid",
    gap: "14px",
  },
  editorField: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  editorLabel: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },
  editorInput: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    background: "#ffffff",
    color: "#0f172a",
    boxShadow: "0 6px 18px rgba(148, 163, 184, 0.08)",
  },
  statusEditor: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusHelper: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },
  toggleShell: {
    minWidth: "140px",
    border: "none",
    borderRadius: "999px",
    padding: "8px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  toggleShellActive: {
    background: "#dcfce7",
    color: "#166534",
  },
  toggleShellInactive: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  toggleKnob: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    background: "currentColor",
    opacity: 0.2,
  },
  toggleKnobActive: {
    opacity: 0.35,
  },
  toggleText: {
    fontSize: "14px",
  },
  courseCard: {
    background: "#ffffff",
    borderRadius: "26px",
    padding: "26px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  },
  courseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  courseTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "26px",
  },
  courseSubtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#64748b",
    lineHeight: "1.6",
  },
  assignBox: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  assignSelect: {
    minWidth: "240px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#ffffff",
    color: "#0f172a",
  },
  assignButton: {
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    padding: "12px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
  },
  warningBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
  },
  loadingBox: {
    padding: "20px",
    borderRadius: "18px",
    background: "#f8fafc",
    color: "#475569",
  },
  courseTableWrap: {
    overflowX: "auto",
  },
  courseTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
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
  removeButton: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    padding: "9px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  inlineHint: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
  },
  emptyCourses: {
    padding: "22px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    borderRadius: "18px",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  statusActive: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusInactive: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  emptyMessage: {
    color: "#64748b",
    margin: 0,
  },
};

export default EstudiantesTable;
