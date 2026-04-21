import ModulePlaceholderView from "../../../shared/components/ModulePlaceholderView";
import { ROUTES } from "../../../shared/utils/routePaths";
import { loadStudentModuleSummary } from "../application/studentService";

const StudentView = () => {
  const summary = loadStudentModuleSummary();

  return (
    <ModulePlaceholderView
      title={summary.title}
      description={summary.description}
      highlights={summary.highlights}
      backRoute={ROUTES.home}
    />
  );
};

export default StudentView;
