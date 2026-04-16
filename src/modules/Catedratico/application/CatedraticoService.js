import FirebaseCatedraticoRepository from "../infrastructure/FirebaseCatedraticoRepository";

class CatedraticoService {
  async getReporteria() {
    try {
      return await FirebaseCatedraticoRepository.getReporteria();
    } catch (error) {
      console.error("Error en service.getReporteria:", error);
      throw new Error("Error al obtener la reportería.");
    }
  }

  async getEstudiantes() {
    try {
      return await FirebaseCatedraticoRepository.getEstudiantes();
    } catch (error) {
      console.error("Error en service.getEstudiantes:", error);
      throw new Error("Error al obtener los estudiantes.");
    }
  }

  async getCursos() {
    try {
      return await FirebaseCatedraticoRepository.getCursos();
    } catch (error) {
      console.error("Error en service.getCursos:", error);
      throw new Error("Error al obtener los cursos.");
    }
  }
}

export default new CatedraticoService();