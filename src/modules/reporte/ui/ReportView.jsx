import ModulePlaceholderView from "../../../shared/components/ModulePlaceholderView";
import { ROUTES } from "../../../shared/utils/routePaths";
import { loadReportModuleSummary } from "../application/reportService";

const ReportView = () => {
  const summary = loadReportModuleSummary();

  return (
    <ModulePlaceholderView
      title={summary.title}
      description={summary.description}
      highlights={summary.highlights}
      backRoute={ROUTES.home}
    />
  );
};

export default ReportView;
