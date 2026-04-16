class FirebaseCatedraticoRepository {
  async getReporteria() {
    try {
      const data = {
        totalEstudiantes: 120,
        totalCursos: 8,
        cursosActivos: 5,
      };

      if (!data) {
        throw new Error("No se encontró la reportería.");
      }

      return data;
    } catch (error) {
      console.error("Error en repository.getReporteria:", error);
      throw new Error("No se pudo obtener la reportería desde el repositorio.");
    }
  }

  async getEstudiantes() {
    try {
      const data = [
        {
          id: 1,
          nombre: "Juan Perez",
          correo: "juan@mium.edu.gt",
          carnet: "1890171377",
          estado: "Activo",
        },
        {
          id: 2,
          nombre: "Maria Gomez",
          correo: "maria@mium.edu.gt",
          carnet: "1890171378",
          estado: "Activo",
        },
      ];

      if (!Array.isArray(data)) {
        throw new Error("La lista de estudiantes no es válida.");
      }

      return data;
    } catch (error) {
      console.error("Error en repository.getEstudiantes:", error);
      throw new Error("No se pudieron obtener los estudiantes desde el repositorio.");
    }
  }

  async getCursos() {
    try {
      const data = [
        {
          id: 1,
          nombre: "Matemáticas",
          codigo: "MAT101",
          estado: "Activo",
        },
        {
          id: 2,
          nombre: "Programación",
          codigo: "PROG101",
          estado: "Activo",
        },
      ];

      if (!Array.isArray(data)) {
        throw new Error("La lista de cursos no es válida.");
      }

      return data;
    } catch (error) {
      console.error("Error en repository.getCursos:", error);
      throw new Error("No se pudieron obtener los cursos desde el repositorio.");
    }
  }
}

export default new FirebaseCatedraticoRepository();