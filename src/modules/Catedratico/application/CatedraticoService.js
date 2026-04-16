import { createCatedraticoCards, mapStudentsForView } from "../domain/CatedraticoRules";
import FirebaseCatedraticoRepository from "../infrastructure/FirebaseCatedraticoRepository";

class CatedraticoService {
  async getDashboardData() {
    const [reporteria, estudiantes] = await Promise.all([
      FirebaseCatedraticoRepository.getReporteria(),
      FirebaseCatedraticoRepository.getEstudiantes(),
    ]);

    return {
      reporteria,
      estudiantes: mapStudentsForView(estudiantes),
      cards: createCatedraticoCards(reporteria),
    };
  }
}

export default new CatedraticoService();
