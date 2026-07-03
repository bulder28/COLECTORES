import { useState } from "react";
import { api } from "../services/api.js";

// Flujo en dos pasos: previsualizar (mapeo de columnas) -> confirmar.
export default function Importar() {
  const [preview, setPreview] = useState(null);
  const [archivoNombre, setArchivoNombre] = useState("");
  const [resultado, setResultado] = useState(null);

  async function onArchivo(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setArchivoNombre(archivo.name);
    setPreview(await api.previsualizarImport(archivo));
  }

  async function confirmar() {
    setResultado(await api.confirmarImport({
      token: preview.token,
      nombre_archivo: archivoNombre,
      mapeo: preview.mapeo_sugerido, // TODO: UI para corregir el mapeo a mano
    }));
    setPreview(null);
  }

  return (
    <section>
      <h2>Importar reporte de OT</h2>
      <input type="file" accept=".xlsx,.csv" onChange={onArchivo} />
      {preview && (
        <div className="panel">
          <p>{preview.total_filas} filas detectadas. Mapeo sugerido listo.</p>
          <button onClick={confirmar}>Importar con este mapeo</button>
        </div>
      )}
      {resultado && (
        <p className="ok">
          Importadas {resultado.registros} piezas de {resultado.ots} OTs
          ({resultado.filas_descartadas} filas descartadas).
        </p>
      )}
    </section>
  );
}
