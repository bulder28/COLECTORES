import * as XLSX from 'xlsx';

const MAPEO_DEFECTO = {
  ot: ["OT", "ORDEN", "OF"],
  medida_tubo: ["MEDIDA_TUBO", "MEDIDA", "DIAMETRO"],
  material: ["MATERIAL", "MAT"],
  l_colector: ["L_COLECTOR", "COLECTOR"],
  l_manguito: ["L_MANGUITO", "MANGUITO"],
};

export async function parsearArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir la hoja a JSON (array de arrays)
        const filas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        if (filas.length === 0) {
          return resolve({ cabeceras: [], filas: [] });
        }
        
        const cabeceras = filas[0].map(c => String(c).trim());
        resolve({ cabeceras, filas: filas.slice(1) });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

export function detectarMapeo(cabeceras) {
  const mapeo = {};
  const normalizadas = cabeceras.map(c => c.toUpperCase().trim());
  
  for (const [campo, alias] of Object.entries(MAPEO_DEFECTO)) {
    const idx = normalizadas.findIndex(c => alias.includes(c));
    mapeo[campo] = idx !== -1 ? idx : null;
  }
  return mapeo;
}

export function normalizarMaterial(valor) {
  const v = String(valor || "").trim().toLowerCase();
  const equivalencias = {
    cu: "Cu", cobre: "Cu",
    fe: "Fe", hierro: "Fe", "hierro/acero": "Fe", acero: "Fe",
    lt: "Lt", laton: "Lt", "latón": "Lt",
    inox: "Inox", "acero inoxidable": "Inox"
  };
  return equivalencias[v] || (String(valor || "").trim() || "N/D");
}

export function prepararImportacion(filas, mapeo) {
  const OTsMap = new Map();
  let nuevos = 0, descartadas = 0, incompletas = 0;
  
  for (const fila of filas) {
    try {
      const codigo = String(fila[mapeo.ot]).trim();
      if (!codigo || codigo.toLowerCase() === "none" || codigo.toLowerCase() === "nan" || codigo === "undefined") {
        descartadas++;
        continue;
      }
      
      let ot = OTsMap.get(codigo);
      if (!ot) {
        ot = {
          codigo,
          prioridad: "media",
          estado: "pendiente",
          creada_en: new Date().toISOString(),
          registros: []
        };
        OTsMap.set(codigo, ot);
      }
      
      const material = normalizarMaterial(fila[mapeo.material]);
      const medida = String(fila[mapeo.medida_tubo] || "").trim();
      
      if (material === "N/D" || !medida) {
        incompletas++;
      }
      
      const base = { medida_tubo: medida || "N/D", material };
      
      // Función auxiliar para parsear número
      const parseLongitud = (val) => {
        if (val === undefined || val === null || val === "") return null;
        const num = parseFloat(val);
        return isNaN(num) || num <= 0 ? null : num;
      };

      // Colector
      const l_col = parseLongitud(fila[mapeo.l_colector]);
      if (l_col !== null) {
        ot.registros.push({ ...base, tipo: "colector", longitud_mm: l_col, cantidad: 1, completados: 0, celda: `${material}|${base.medida_tubo}` });
        nuevos++;
      }
      
      // Manguito
      const l_man = parseLongitud(fila[mapeo.l_manguito]);
      if (l_man !== null) {
        ot.registros.push({ ...base, tipo: "manguito", longitud_mm: l_man, cantidad: 1, completados: 0, celda: `${material}|${base.medida_tubo}` });
        nuevos++;
      }
      
    } catch (err) {
      console.warn("Fila descartada por error", err);
      descartadas++;
    }
  }
  
  return {
    ots: Array.from(OTsMap.values()),
    stats: {
      ots: OTsMap.size,
      registros: nuevos,
      filas_descartadas: descartadas,
      filas_incompletas: incompletas
    }
  };
}
