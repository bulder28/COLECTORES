// ============================================
// Import Module - Excel/CSV/Text Import
// ============================================

const Import = {

    // Temporary storage for mapper
    _lastRows: null,
    _lastHeaders: null,
    _lastHasHeader: false,

    /**
     * Handle file import (Excel or CSV)
     */
    importarDesdeArchivo() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput ? fileInput.files[0] : null;

        if (!file) {
            showToast('Selecciona un archivo Excel (.xlsx, .xls) o CSV', 'warning');
            return;
        }

        const isCsv = /\.csv$/i.test(file.name);
        const reader = new FileReader();

        reader.onload = (event) => {
            let workbook;
            try {
                const data = event.target.result;
                workbook = isCsv
                    ? XLSX.read(data, { type: 'string' })
                    : XLSX.read(data, { type: 'binary' });
            } catch (error) {
                showToast('No se pudo leer el archivo. Asegúrate de que sea un Excel o CSV válido.', 'error');
                return;
            }

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

            if (rows.length === 0) {
                showToast('El archivo está vacío', 'warning');
                return;
            }

            this._processRows(rows, file.name);
        };

        if (isCsv) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsBinaryString(file);
        }
    },

    /**
     * Handle text paste import
     */
    importarDesdeTexto() {
        const textarea = document.getElementById('importText');
        const text = textarea ? textarea.value.trim() : '';

        if (!text) {
            showToast('Pega el listado de OF en el área de texto', 'warning');
            return;
        }

        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const nuevos = [];
        const errores = [];

        lines.forEach((line, index) => {
            // Try semicolon, comma, or tab separator
            let partes;
            if (line.includes(';')) {
                partes = line.split(';').map(p => p.trim());
            } else if (line.includes('\t')) {
                partes = line.split('\t').map(p => p.trim());
            } else if (line.includes(',')) {
                partes = line.split(',').map(p => p.trim());
            } else {
                errores.push(index + 1);
                return;
            }

            if (partes.length < 6) {
                errores.push(index + 1);
                return;
            }

            const [numero, tipo, medida, materialRaw, longitudStr, cantidadStr, prioridadRaw] = partes;
            const material = Optimizer.normalizarMaterial(materialRaw);
            const prioridad = Optimizer.normalizarPrioridad(prioridadRaw);
            const longitud = parseInt(longitudStr, 10);
            const cantidad = parseInt(cantidadStr, 10);

            if (!numero || !medida || !material || isNaN(longitud) || isNaN(cantidad)) {
                errores.push(index + 1);
                return;
            }

            nuevos.push({
                numero,
                tipo: tipo || 'colector',
                medida,
                material,
                prioridad,
                longitud,
                cantidad,
                completedCount: 0,
                tiempos_corte: [],
                corte_inicio: null,
                estado: 'pendiente'
            });
        });

        if (errores.length > 0) {
            showToast(`Error en las líneas: ${errores.join(', ')}. Formato: OF;tipo;medida;material;longitud;cantidad;prioridad`, 'error');
            return;
        }

        if (nuevos.length === 0) {
            showToast('No se encontraron registros válidos', 'warning');
            return;
        }

        this._saveToFirestore(nuevos, textarea);
    },

    /**
     * Process rows from Excel/CSV file
     */
    _processRows(rows, fileName) {
        const firstRow = rows[0].map(cell => String(cell || '').toLowerCase().trim());
        const headerEvidence = firstRow.join(' ');
        const hasHeader = /of\b|numero|número|id\b|tipo\b|medida|material|longitud|cantidad|qty|length|size|prioridad/i.test(headerEvidence);
        const dataRows = hasHeader ? rows.slice(1) : rows;

        // Try automatic detection
        const headerMap = {};
        if (hasHeader) {
            firstRow.forEach((h, i) => {
                if (!h) return;
                if (/^(of|numero|número|id|norden)$/i.test(h)) headerMap.numero = i;
                else if (/nordenpadre/i.test(h)) headerMap.nordenpadre = i;
                else if (/descripci|tipo|type|pf/i.test(h) && headerMap.tipo === undefined) headerMap.tipo = i;
                else if (/medida|size|tamaño|tama|medida_tubo/i.test(h) && headerMap.medida === undefined) headerMap.medida = i;
                else if (/material|mat/i.test(h) && headerMap.material === undefined) headerMap.material = i;
                else if (/longitud|length|largo|mm|len|l_colector/i.test(h) && headerMap.longitud === undefined) headerMap.longitud = i;
                else if (/manguito/i.test(h) && headerMap.longitud_manguito === undefined) headerMap.longitud_manguito = i;
                else if (/cantidad|qty|quantity|cant/i.test(h) && headerMap.cantidad === undefined) headerMap.cantidad = i;
                else if (/prioridad|priority|prio/i.test(h) && headerMap.prioridad === undefined) headerMap.prioridad = i;
            });
        }

        const nuevos = [];
        const errores = [];

        dataRows.forEach((row, index) => {
            if (!row || row.length < 1) { errores.push(index + 1); return; }

            const safe = (i) => String(row[i] === undefined ? '' : row[i]).trim();
            const getField = (field, fallback) => headerMap[field] !== undefined ? safe(headerMap[field]) : safe(fallback);

            let numero = getField('numero', 0);
            let tipo = getField('tipo', 1); // Also acts as PF/Descripción
            let medida = getField('medida', 2);
            let materialRaw = getField('material', 3);
            let longitudStr = getField('longitud', 4);
            let longitudManguitoStr = getField('longitud_manguito', -1);
            let cantidadStr = getField('cantidad', 5);
            let prioridadRaw = getField('prioridad', 6);
            let nordenPadre = getField('nordenpadre', -1);

            // Extracción de L (Colector) y M (Manguito) desde la descripción
            if (tipo) {
                const matchL = tipo.match(/(?:^|-|\s)(\d+(?:[\.,]\d+)?)L(?:$|-|\s)/i);
                if (matchL && !longitudStr) longitudStr = matchL[1];

                const matchM = tipo.match(/(?:^|-|\s)(\d+(?:[\.,]\d+)?)M(?:$|-|\s)/i);
                if (matchM && !longitudManguitoStr) longitudManguitoStr = matchM[1];
            }

            const material = Optimizer.normalizarMaterial(materialRaw);
            const prioridad = Optimizer.normalizarPrioridad(prioridadRaw);
            const longitud = parseInt(longitudStr, 10);
            const longitud_manguito = longitudManguitoStr ? parseInt(longitudManguitoStr, 10) : null;
            let cantidad = parseInt(cantidadStr, 10);
            
            // Si la cantidad no viene en el Excel, asumimos 1 por defecto
            if (isNaN(cantidad) || cantidad <= 0) cantidad = 1;

            if (!numero || !medida || !material || isNaN(longitud)) {
                errores.push(index + 1);
                return;
            }

            nuevos.push({
                numero, norden_padre: nordenPadre, tipo: tipo || 'colector', medida, material, prioridad,
                longitud, longitud_manguito, cantidad, completedCount: 0, tiempos_corte: [],
                corte_inicio: null, estado: 'pendiente'
            });
        });

        // If auto-detection found errors, show column mapper
        if (errores.length > 0 || nuevos.length === 0) {
            const headers = hasHeader ? rows[0].map(c => String(c || '')) : rows[0].map((_, i) => 'Col ' + i);
            this.showColumnMapper(headers, rows, hasHeader);
            showToast(`Detectados ${errores.length} errores. Usa el mapeo manual.`, 'warning');
            return;
        }

        this._saveToFirestore(nuevos, document.getElementById('importFile'));
    },

    /**
     * Save imported orders to Firestore
     */
    async _saveToFirestore(nuevos, inputElement) {
        try {
            showToast(`Importando ${nuevos.length} órdenes...`, 'info');
            await DB.importarOrdenes(nuevos);
            showToast(`<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></svg> Se importaron ${nuevos.length} órdenes de trabajo`, 'success');

            // Clear input
            if (inputElement) {
                if (inputElement.type === 'file') inputElement.value = '';
                else inputElement.value = '';
            }

            // Navigate to orders table
            if (typeof App !== 'undefined' && App.navigateTo) {
                App.navigateTo('ordenes');
            }
        } catch (error) {
            showToast('Error al importar: ' + error.message, 'error');
        }
    },

    // ==========================================
    // COLUMN MAPPER
    // ==========================================

    /**
     * Show column mapper UI
     */
    showColumnMapper(headers, rows, hasHeader) {
        this._lastRows = rows;
        this._lastHeaders = headers;
        this._lastHasHeader = hasHeader;

        const selects = ['map_numero', 'map_tipo', 'map_medida', 'map_material', 'map_longitud', 'map_cantidad', 'map_prioridad'];

        selects.forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            sel.innerHTML = '<option value="-1">-- Ninguno --</option>';
            headers.forEach((h, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = h || ('Col ' + i);
                sel.appendChild(opt);
            });
        });

        // Auto-detect column mapping
        const headerText = headers.join(' ').toLowerCase();
        const tryMatch = (id, pattern) => {
            const el = document.getElementById(id);
            if (!el) return;
            const idx = headers.findIndex(h => pattern.test(String(h || '')));
            if (idx >= 0) el.value = idx;
        };

        tryMatch('map_numero', /of|numero|número|id/i);
        tryMatch('map_tipo', /tipo|type/i);
        tryMatch('map_medida', /medida|size|tama/i);
        tryMatch('map_material', /material|mat/i);
        tryMatch('map_longitud', /longitud|length|largo|mm|len/i);
        tryMatch('map_cantidad', /cantidad|qty|quantity|cant/i);
        tryMatch('map_prioridad', /prioridad|priority|prio/i);

        // Show preview
        const dataRows = hasHeader ? rows.slice(1) : rows;
        const preview = document.getElementById('mapperPreview');
        if (preview) {
            let previewHtml = '<div class="table-wrapper"><table><thead><tr>';
            headers.forEach(h => { previewHtml += `<th>${h || ''}</th>`; });
            previewHtml += '</tr></thead><tbody>';
            dataRows.slice(0, 5).forEach(r => {
                previewHtml += '<tr>';
                for (let i = 0; i < headers.length; i++) {
                    previewHtml += `<td>${r[i] === undefined ? '' : r[i]}</td>`;
                }
                previewHtml += '</tr>';
            });
            previewHtml += '</tbody></table></div>';
            if (dataRows.length > 5) {
                previewHtml += `<p class="text-muted text-sm mt-2">Mostrando 5 de ${dataRows.length} filas</p>`;
            }
            preview.innerHTML = previewHtml;
        }

        // Show mapper
        const mapper = document.getElementById('columnMapper');
        if (mapper) {
            mapper.classList.add('active');
            mapper.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * Apply column mapping and import
     */
    applyColumnMapping() {
        const rows = this._lastRows || [];
        const hasHeader = this._lastHasHeader;
        const headers = this._lastHeaders || [];
        const dataRows = hasHeader ? rows.slice(1) : rows;

        const getVal = (id) => parseInt(document.getElementById(id)?.value || '-1', 10);

        const mapping = {
            numero: getVal('map_numero'),
            tipo: getVal('map_tipo'),
            medida: getVal('map_medida'),
            material: getVal('map_material'),
            longitud: getVal('map_longitud'),
            cantidad: getVal('map_cantidad'),
            prioridad: getVal('map_prioridad')
        };

        const nuevos = [];
        const errores = [];

        dataRows.forEach((row, idx) => {
            const safe = (i) => String(row[i] === undefined ? '' : row[i]).trim();
            const numero = mapping.numero >= 0 ? safe(mapping.numero) : '';
            const tipo = mapping.tipo >= 0 ? safe(mapping.tipo) : 'colector';
            const medida = mapping.medida >= 0 ? safe(mapping.medida) : '';
            const materialRaw = mapping.material >= 0 ? safe(mapping.material) : '';
            const longitudStr = mapping.longitud >= 0 ? safe(mapping.longitud) : '';
            const cantidadStr = mapping.cantidad >= 0 ? safe(mapping.cantidad) : '';
            const prioridadRaw = mapping.prioridad >= 0 ? safe(mapping.prioridad) : '';

            const material = Optimizer.normalizarMaterial(materialRaw);
            const prioridad = Optimizer.normalizarPrioridad(prioridadRaw);
            const longitud = parseInt(longitudStr, 10);
            const cantidad = parseInt(cantidadStr, 10);

            if (!numero || !medida || !material || isNaN(longitud) || isNaN(cantidad)) {
                errores.push(idx + 1);
                return;
            }

            nuevos.push({
                numero, tipo: tipo || 'colector', medida, material, prioridad,
                longitud, cantidad, completedCount: 0, tiempos_corte: [],
                corte_inicio: null, estado: 'pendiente'
            });
        });

        if (errores.length > 0) {
            showToast(`Error en filas: ${errores.slice(0, 10).join(', ')}${errores.length > 10 ? '...' : ''}. Revisa el mapeo.`, 'error');
            return;
        }

        if (nuevos.length === 0) {
            showToast('No se generaron registros con el mapeo proporcionado', 'warning');
            return;
        }

        // Hide mapper
        const mapper = document.getElementById('columnMapper');
        if (mapper) mapper.classList.remove('active');

        this._saveToFirestore(nuevos, document.getElementById('importFile'));
    },

    /**
     * Cancel column mapping
     */
    cancelMapper() {
        const mapper = document.getElementById('columnMapper');
        if (mapper) mapper.classList.remove('active');
        this._lastRows = null;
        this._lastHeaders = null;
    },

    /**
     * Load predefined sample data
     */
    async cargarEjemplo() {
        const ejemplos = [
            { numero: 'OF-001', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 1460, cantidad: 2, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
            { numero: 'OF-001', tipo: 'manguito', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 546, cantidad: 2, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
            { numero: 'OF-002', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Normal', longitud: 1200, cantidad: 4, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
            { numero: 'OF-003', tipo: 'colector', medida: '5/8', material: 'Cobre', prioridad: 'Baja', longitud: 800, cantidad: 3, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
        ];

        try {
            await DB.importarOrdenes(ejemplos);
            showToast('<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></svg> Datos de ejemplo cargados (4 órdenes)', 'success');
        } catch (error) {
            showToast('Error al cargar ejemplo: ' + error.message, 'error');
        }
    }
};
