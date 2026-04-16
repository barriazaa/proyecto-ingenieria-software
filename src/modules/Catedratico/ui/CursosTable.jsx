import { useEffect, useState } from "react";
import CatedraticoService from "../application/CatedraticoService";

const CursosTable = () => {
  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await CatedraticoService.getCursos();
      setCursos(data);
    };

    load();
  }, []);

  return (
    <div>
      <h3>Cursos</h3>

      {cursos.length === 0 ? (
        <p>No hay cursos</p>
      ) : (
        <ul>
          {cursos.map((c, i) => (
            <li key={i}>{c.nombre || JSON.stringify(c)}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CursosTable;