import { useEffect, useState } from "react";
import CatedraticoService from "../application/CatedraticoService";

const ReporteriaSection = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await CatedraticoService.getReporteria();
      setData(res);
    };
    load();
  }, []);

  return (
    <div>
      <h3>Reportería</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default ReporteriaSection;