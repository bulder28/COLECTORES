import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import MapaBarra from "../components/MapaBarra.jsx";

// Configura la barra de stock, elige celda y calcula la distribución.
export default function Nesting() {
  const [celdas, setCeldas] = useState([]);
  const [config, setConfig] = useState({ largo_barra_mm: 6000, ancho_sierra_mm: 3, margen_seguridad_mm: 20 });
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api.celdas().then(setCeldas); }, []);

  async function calcular(celda) {
    setError("");
    try {
      setPlan(await api.optimizar({ material: celda.material, medida_tubo: celda.medida, ...config }));
    } catch (e) { setError(e.message); }
  }

  return (
    <section>
      <h2>Configuración del tubo de stock</h2>
      <div className="config-row">
        {["largo_barra_mm", "ancho_sierra_mm", "margen_seguridad_mm"].map(k => (
          <label key={k}>{k.replaceAll("_", " ")}
            <input type="number" value={config[k]}
              onChange={e => setConfig({ ...config, [k]: +e.target.value })} />
          </label>
        ))}
      </div>

      <h2>Calcular distribución por celda</h2>
      <div className="celda-grid">
        {celdas.map(c => (
          <button key={c.celda} className="celda-card" onClick={() => calcular(c)}>
            {c.material} · {c.medida} ({c.piezas - c.completadas} pendientes)
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {plan && (
        <>
          <h2>Mapa de aprovechamiento — {plan.celda} · {plan.barras_totales} barras · {plan.aprovechamiento}%</h2>
          {plan.barras.map(b => (
            <MapaBarra key={b.numero} barra={b} largoBarra={plan.largo_barra_mm} />
          ))}
        </>
      )}
    </section>
  );
}
