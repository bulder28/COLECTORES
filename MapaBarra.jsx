// Visualización 1D de una barra: cada corte como segmento proporcional.
export default function MapaBarra({ barra, largoBarra }) {
  return (
    <div className="barra">
      <span className="barra-label">Barra {barra.numero} · {barra.aprovechamiento}% · retal {barra.retal_mm} mm</span>
      <div className="barra-track">
        {barra.cortes.map((c, i) => (
          <div key={i} className="barra-corte" title={`${c.longitud_mm} mm`}
            style={{ width: `${(100 * c.longitud_mm) / largoBarra}%` }}>
            {c.longitud_mm}
          </div>
        ))}
        <div className="barra-retal" style={{ width: `${(100 * barra.retal_mm) / largoBarra}%` }} />
      </div>
    </div>
  );
}
