import * as XLSX from 'xlsx';

/**
 * Procesa el archivo Excel/CSV y normaliza las órdenes de corte.
 * @param {File} file - El archivo subido por el usuario.
 * @returns {Promise<Array>} - Promesa que resuelve a la lista de órdenes normalizadas.
 */
export const parseExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const normalizedOrders = [];

        jsonData.forEach((row, index) => {
          let length = parseFloat(row['L_COLECTOR']);
          
          // Si L_COLECTOR está vacío o no es un número, intentar extraerlo de la descripción
          if (isNaN(length) || length <= 0) {
            const desc = row['Descripción'] || '';
            const match = desc.match(/(\d+)L/);
            if (match && match[1]) {
              length = parseFloat(match[1]);
            } else {
              // Si aún así no hay medida, marcamos error
              length = 0;
            }
          }

          let quantity = parseInt(row['CANTIDAD'], 10);
          if (isNaN(quantity) || quantity <= 0) quantity = 1;

          // Crear múltiples registros individuales por cada CANTIDAD
          for (let i = 0; i < quantity; i++) {
            normalizedOrders.push({
              id: `${row['NOrden'] || `UNK-${index}`}-${i+1}`,
              orderId: row['NOrden'],
              parentId: row['NOrdenPadre'],
              description: row['Descripción'],
              material: row['MATERIAL'],
              tubSize: row['MEDIDA_TUB'],
              length: length,
              priority: row['Prioridad'] || 'Normal'
            });
          }
        });

        // Filtrar órdenes que no tengan longitud válida
        const validOrders = normalizedOrders.filter(o => o.length > 0);
        resolve(validOrders);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
};
