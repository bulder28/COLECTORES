/**
 * Nesting 1D: distribución de cortes en barras de stock.
 * Algoritmo: First Fit Decreasing (FFD)
 */

export function optimizar(
  piezas,
  largo_barra_mm,
  ancho_sierra_mm = 3,
  margen_seguridad_mm = 20
) {
  const capacidad = largo_barra_mm - 2 * margen_seguridad_mm;
  const invalidas = piezas.filter((p) => p.longitud_mm > capacidad);
  if (invalidas.length > 0) {
    const ids = invalidas.map((p) => p.registro_id).join(", ");
    throw new Error(`Hay piezas más largas que la barra útil (${capacidad} mm): registros ${ids}`);
  }

  const barras = [];

  // Ordenar piezas de mayor a menor (First Fit Decreasing)
  const piezasOrdenadas = [...piezas].sort((a, b) => b.longitud_mm - a.longitud_mm);

  for (const pieza of piezasOrdenadas) {
    let destino = barras.find((b) => cabeEnBarra(b, pieza, ancho_sierra_mm, capacidad));
    if (!destino) {
      destino = {
        numero: barras.length + 1,
        capacidad_mm: capacidad,
        cortes: [],
        usado_mm: 0,
      };
      barras.push(destino);
    }
    agregarPiezaABarra(destino, pieza, ancho_sierra_mm);
  }

  // Calcular retal y aprovechamiento para cada barra
  barras.forEach((b) => {
    b.retal_mm = parseFloat((b.capacidad_mm - b.usado_mm).toFixed(1));
    b.aprovechamiento = parseFloat(((100 * b.usado_mm) / b.capacidad_mm).toFixed(1));
  });

  return barras;
}

function cabeEnBarra(barra, pieza, kerf, capacidad) {
  const extra = barra.cortes.length > 0 ? kerf : 0;
  return barra.usado_mm + extra + pieza.longitud_mm <= capacidad;
}

function agregarPiezaABarra(barra, pieza, kerf) {
  if (barra.cortes.length > 0) {
    barra.usado_mm += kerf;
  }
  barra.cortes.push(pieza);
  barra.usado_mm += pieza.longitud_mm;
}

export function aprovechamientoGlobal(barras) {
  if (!barras || barras.length === 0) return 0;
  const total = barras.reduce((sum, b) => sum + b.capacidad_mm, 0);
  const usado = barras.reduce((sum, b) => sum + b.usado_mm, 0);
  return parseFloat(((100 * usado) / total).toFixed(1));
}
