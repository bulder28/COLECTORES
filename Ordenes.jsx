import { useEffect, useState } from "react";
import { api } from "../services/api.js";

// Celdas homogéneas (Estrategia 3) + tabla de registros con seguimiento.
export default function Ordenes() {
  const [celdas, setCeldas] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState(null);

  useEffect(() => { api.celdas().then(setCeldas); }, []);
  useEffect(() => {
    const f = filtro ? { material: filtro.material, medida: filtro.medida } : {};
    api.registros(f).then(setRegistros);
  }, [filtro]);

  async function marcar(id, delta) {
    await api.actualizarCompletados(id, delta);
    setRegistros(rs => rs.map(r => r.id === id
      ? { ...r, completados: Math.max(0, Math.min(r.cantidad, r.completados + delta)) } : r));
  }

  return (
    <section>
      <h2>Celdas homogéneas de trabajo</h2>
      <div className="celda-grid">
        {celdas.map(c => (
          <button key={c.celda} className="celda-card" onClick={() => setFiltro(c)}>
            <strong>{c.material} · {c.medida}</strong>
            <span>{c.completadas}/{c.piezas} piezas</span>
          </button>
        ))}
        {filtro && <button onClick={() => setFiltro(null)}>Mostrar todo</button>}
      </div>

      <h2>Registros de fabricación</h2>
      <table>
        <thead><tr><th>OT</th><th>Celda</th><th>Tipo</th><th>Long. (mm)</th><th>Hechas</th><th></th></tr></thead>
        <tbody>
          {registros.map(r => (
            <tr key={r.id}>
              <td>{r.ot}</td><td>{r.celda}</td><td>{r.tipo}</td>
              <td>{r.longitud_mm}</td><td>{r.completados}/{r.cantidad}</td>
              <td>
                <button onClick={() => marcar(r.id, +1)}>+1</button>
                <button onClick={() => marcar(r.id, -1)}>−1</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
