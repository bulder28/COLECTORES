import { useEffect, useState } from "react";
import { api } from "../services/api.js";

// Tarjetas de resumen: OTs, piezas, progreso, aprovechamiento medio.
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.stats().then(setStats).catch(console.error); }, []);
  if (!stats) return <p>Cargando…</p>;
  return (
    <section>
      <h2>Panel de taller</h2>
      <div className="stat-grid">
        <article className="stat-card"><h3>{stats.ots}</h3><p>Órdenes de trabajo</p></article>
        <article className="stat-card"><h3>{stats.piezas_totales}</h3><p>Piezas totales</p></article>
        <article className="stat-card"><h3>{stats.progreso_pct}%</h3><p>Progreso de corte</p></article>
        <article className="stat-card"><h3>{stats.aprovechamiento_medio?.toFixed?.(1) ?? "—"}%</h3><p>Aprovechamiento medio</p></article>
      </div>
    </section>
  );
}
