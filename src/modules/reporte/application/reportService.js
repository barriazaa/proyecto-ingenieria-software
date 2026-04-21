import { getReportHighlights } from "../infrastructure/mockReportRepository";

export const loadReportModuleSummary = () => ({
  title: "Modulo Reporte",
  description:
    "Aqui viviran los casos de uso y vistas de reporteria sin mezclarse con otros dominios del sistema.",
  highlights: getReportHighlights(),
});
