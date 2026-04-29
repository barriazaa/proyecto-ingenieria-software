const CourseList = ({ courses, onCourseSelect }) => {
  if (courses.length === 0) {
    return (
      <section className="student-panel">
        <div className="student-section-heading">
          <span>Cursos</span>
          <h2>Cursos asignados</h2>
        </div>
        <div className="student-empty-state">Aun no tienes cursos asignados.</div>
      </section>
    );
  }

  return (
    <section className="student-panel">
      <div className="student-section-heading">
        <span>Cursos</span>
        <h2>Cursos asignados</h2>
      </div>

      <div className="student-course-list">
        {courses.map((course) => (
          <button
            type="button"
            className="student-course-card"
            key={course.id}
            onClick={() => onCourseSelect(course)}
          >
            <div>
              <strong>{course.nombre}</strong>
              <span>
                {course.codigo || "Curso"} - Seccion {course.seccion || "N/A"}
              </span>
            </div>
            <small>{(course.dias || []).join(", ") || "Dias por definir"}</small>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CourseList;
