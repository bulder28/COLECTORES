<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Importar Órdenes</h1>
        <p class="section-subtitle">Importa desde archivo Excel/CSV</p>
      </div>
    </div>

    <div class="grid-2">
      <!-- File Import -->
      <div class="card">
        <h3 class="card-title mb-4">Desde Archivo Excel</h3>
        <div class="import-zone" :class="{ dragover: isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDrop"
          @click="$refs.fileInput.click()">
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="onFileChange">
          <div class="import-zone-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
            </svg>
          </div>
          <div class="import-zone-text">
            <strong>Arrastra un archivo</strong> o haz clic para seleccionar<br>
            <span class="text-xs text-muted">Formatos: .xlsx, .xls, .csv</span>
          </div>
          <div v-if="selectedFile" class="import-file-name">📎 {{ selectedFile.name }}</div>
        </div>

        <!-- Column format hint -->
        <div class="form-hint mt-4" style="background:var(--surface-2,rgba(255,255,255,0.05));padding:10px;border-radius:8px;font-size:0.8rem;">
          <strong>Columnas detectadas automáticamente:</strong><br>
          <code>NOrden · NOrdenPadre · Descripción · MEDIDA_TUB · L_COLECTOR · L_MANGUITO · MATERIAL</code>
          <br><span class="text-muted">Si L_COLECTOR o L_MANGUITO están vacías, se extraen de la descripción (e.g. 3550L, 306M)</span>
        </div>

        <div class="mt-4">
          <button class="btn btn-primary" :disabled="!selectedFile || importing" @click="importarArchivo">
            {{ importing ? 'Importando...' : 'Importar Archivo' }}
          </button>
        </div>
      </div>

      <!-- Text paste -->
      <div class="card">
        <h3 class="card-title mb-4">Pegar Texto</h3>
        <textarea class="form-textarea" v-model="textoPegado" rows="8"
          placeholder="Pega aquí el listado de OFs.&#10;Formato: OF;tipo;medida;material;longitud;cantidad;prioridad&#10;Ejemplo: OF-001;colector;1/2;Cobre;1460;2;Alta">
        </textarea>
        <div class="form-hint">Separadores: punto y coma (;), tabulador, coma</div>
        <div class="mt-4 action-row">
          <button class="btn btn-primary" @click="importarTexto">Importar Texto</button>
          <button class="btn btn-secondary" @click="cargarEjemplo">Cargar Ejemplo</button>
        </div>
      </div>
    </div>

    <!-- Result toast inline -->
    <div v-if="resultado" class="card mt-6" :class="resultado.type === 'error' ? 'border-red' : 'border-green'"
      style="border-left:4px solid;padding:16px;">
      <strong>{{ resultado.type === 'error' ? '⚠️ Error' : '✅ Importado' }}:</strong> {{ resultado.msg }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useOrdenesStore } from '../stores/ordenes'

const store = useOrdenesStore()
const fileInput = ref(null)
const selectedFile = ref(null)
const isDragging = ref(false)
const importing = ref(false)
const textoPegado = ref('')
const resultado = ref(null)

function onFileChange(e) {
  selectedFile.value = e.target.files[0] || null
}

function onDrop(e) {
  isDragging.value = false
  selectedFile.value = e.dataTransfer.files[0] || null
}

function normalizarMaterial(m) {
  const v = String(m || '').trim()
  if (/^(cu|cobre)$/i.test(v)) return 'Cobre'
  if (/^(fe|hierro)$/i.test(v)) return 'Hierro'
  return v || 'Cobre'
}

function normalizarPrioridad(p) {
  const v = String(p || 'Normal').trim()
  if (/^(alta|high|urgente)$/i.test(v)) return 'Alta'
  if (/^(baja|low)$/i.test(v)) return 'Baja'
  return 'Normal'
}

function extraerMedidas(tipo, longitudStr, longitudManguitoStr) {
  if (tipo) {
    if (!longitudStr) {
      const m = tipo.match(/(?:^|-|\s)(\d+(?:[.,]\d+)?)L(?:$|-|\s)/i)
      if (m) longitudStr = m[1]
    }
    if (!longitudManguitoStr) {
      const m = tipo.match(/(?:^|-|\s)(\d+(?:[.,]\d+)?)M(?:$|-|\s)/i)
      if (m) longitudManguitoStr = m[1]
    }
  }
  return { longitudStr, longitudManguitoStr }
}

async function importarArchivo() {
  if (!selectedFile.value) return
  importing.value = true
  resultado.value = null
  try {
    const data = await selectedFile.value.arrayBuffer()
    const wb = XLSX.read(data)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })
    if (!rows.length) throw new Error('El archivo está vacío')

    const firstRow = rows[0].map(c => String(c || '').toLowerCase().trim())
    const hm = {}
    firstRow.forEach((h, i) => {
      if (/^(norden|of|numero|id)$/i.test(h)) hm.numero = i
      else if (/nordenpadre/i.test(h)) hm.nordenpadre = i
      else if (/descripci|tipo|pf/i.test(h) && hm.tipo === undefined) hm.tipo = i
      else if (/medida|medida_tub/i.test(h) && hm.medida === undefined) hm.medida = i
      else if (/material/i.test(h) && hm.material === undefined) hm.material = i
      else if (/l_colector|longitud|length/i.test(h) && hm.longitud === undefined) hm.longitud = i
      else if (/l_manguito|manguito/i.test(h) && hm.longitud_manguito === undefined) hm.longitud_manguito = i
      else if (/cantidad|qty/i.test(h) && hm.cantidad === undefined) hm.cantidad = i
      else if (/prioridad|priority/i.test(h) && hm.prioridad === undefined) hm.prioridad = i
    })

    const dataRows = rows.slice(1)
    const nuevos = []
    const errores = []

    dataRows.forEach((row, idx) => {
      const safe = (i) => String(row[i] === undefined ? '' : row[i]).trim()
      const g = (field, fallback) => hm[field] !== undefined ? safe(hm[field]) : safe(fallback)

      const numero = g('numero', 0)
      const tipo = g('tipo', 1)
      const medida = g('medida', 2)
      const materialRaw = g('material', 3)
      let longitudStr = g('longitud', 4)
      let longitudManguitoStr = g('longitud_manguito', -1)
      const cantidadStr = g('cantidad', 5)
      const prioridadRaw = g('prioridad', 6)
      const nordenPadre = g('nordenpadre', -1)

      const extracted = extraerMedidas(tipo, longitudStr, longitudManguitoStr)
      longitudStr = extracted.longitudStr
      longitudManguitoStr = extracted.longitudManguitoStr

      const material = normalizarMaterial(materialRaw)
      const prioridad = normalizarPrioridad(prioridadRaw)
      const longitud = parseInt(longitudStr, 10)
      const longitud_manguito = longitudManguitoStr ? parseInt(longitudManguitoStr, 10) : null
      let cantidad = parseInt(cantidadStr, 10)
      if (isNaN(cantidad) || cantidad <= 0) cantidad = 1

      if (!numero || !medida || !material || isNaN(longitud)) {
        errores.push(idx + 2)
        return
      }

      nuevos.push({
        numero, norden_padre: nordenPadre, tipo: tipo || 'colector',
        medida, material, prioridad, longitud, longitud_manguito,
        cantidad, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente'
      })
    })

    if (errores.length > 0 && nuevos.length === 0) {
      throw new Error(`Errores en filas: ${errores.slice(0, 10).join(', ')}. Revisa el formato.`)
    }

    await store.importar(nuevos)
    resultado.value = { type: 'success', msg: `${nuevos.length} órdenes importadas correctamente${errores.length > 0 ? ` (${errores.length} filas con error ignoradas)` : ''}` }
    selectedFile.value = null
  } catch (e) {
    resultado.value = { type: 'error', msg: e.message }
  } finally {
    importing.value = false
  }
}

async function importarTexto() {
  const lines = textoPegado.value.split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return
  const nuevos = []
  lines.forEach(line => {
    let partes
    if (line.includes(';')) partes = line.split(';').map(p => p.trim())
    else if (line.includes('\t')) partes = line.split('\t').map(p => p.trim())
    else if (line.includes(',')) partes = line.split(',').map(p => p.trim())
    else return
    if (partes.length < 5) return
    const [numero, tipo, medida, materialRaw, longitudStr, cantidadStr, prioridadRaw] = partes
    const material = normalizarMaterial(materialRaw)
    const longitud = parseInt(longitudStr, 10)
    const cantidad = parseInt(cantidadStr || '1', 10)
    if (!numero || !medida || !material || isNaN(longitud)) return
    nuevos.push({
      numero, tipo: tipo || 'colector', medida, material,
      prioridad: normalizarPrioridad(prioridadRaw), longitud,
      cantidad: isNaN(cantidad) ? 1 : cantidad,
      completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente'
    })
  })
  if (!nuevos.length) { resultado.value = { type: 'error', msg: 'No se encontraron registros válidos' }; return }
  try {
    await store.importar(nuevos)
    resultado.value = { type: 'success', msg: `${nuevos.length} órdenes importadas` }
    textoPegado.value = ''
  } catch (e) {
    resultado.value = { type: 'error', msg: `Error al importar: ${e.message}` }
  }
}

async function cargarEjemplo() {
  const ejemplos = [
    // ═══ COBRE 1/2" ═══
    // BAT-101 (Alta) — piezas cortas
    { numero: 'OF-001', norden_padre: 'BAT-101', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 800, longitud_manguito: null, cantidad: 4, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-002', norden_padre: 'BAT-101', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 650, longitud_manguito: null, cantidad: 3, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },

    // BAT-102 (Alta) — piezas largas (MISMA prioridad que BAT-101!)
    { numero: 'OF-003', norden_padre: 'BAT-102', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 2800, longitud_manguito: null, cantidad: 3, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-004', norden_padre: 'BAT-102', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 1900, longitud_manguito: null, cantidad: 2, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },

    // BAT-103 (Alta) — mezcla de tamaños (MISMA prioridad!)
    { numero: 'OF-005', norden_padre: 'BAT-103', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 3500, longitud_manguito: null, cantidad: 2, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-006', norden_padre: 'BAT-103', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 1200, longitud_manguito: null, cantidad: 3, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-007', norden_padre: 'BAT-103', tipo: 'colector', medida: '1/2', material: 'Cobre', prioridad: 'Alta', longitud: 450, longitud_manguito: null, cantidad: 4, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },

    // ═══ HIERRO 3/8" ═══
    // BAT-201 (Alta) — tubos medianos
    { numero: 'OF-008', norden_padre: 'BAT-201', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Alta', longitud: 2200, longitud_manguito: null, cantidad: 3, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-009', norden_padre: 'BAT-201', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Alta', longitud: 1100, longitud_manguito: null, cantidad: 4, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },

    // BAT-202 (Alta) — tubos grandes y pequeños (MISMA prioridad!)
    { numero: 'OF-010', norden_padre: 'BAT-202', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Alta', longitud: 4200, longitud_manguito: null, cantidad: 2, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-011', norden_padre: 'BAT-202', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Alta', longitud: 700, longitud_manguito: null, cantidad: 5, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-012', norden_padre: 'BAT-202', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Alta', longitud: 1500, longitud_manguito: null, cantidad: 3, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },

    // BAT-203 (Alta) — piezas de relleno (MISMA prioridad!)
    { numero: 'OF-013', norden_padre: 'BAT-203', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Alta', longitud: 3100, longitud_manguito: null, cantidad: 2, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
    { numero: 'OF-014', norden_padre: 'BAT-203', tipo: 'colector', medida: '3/8', material: 'Hierro', prioridad: 'Alta', longitud: 550, longitud_manguito: null, cantidad: 6, completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente' },
  ]
  await store.importar(ejemplos)
  resultado.value = { type: 'success', msg: 'Datos de ejemplo cargados (14 OFs / 6 baterías / ~50 piezas)' }
}
</script>

<style scoped>
.import-file-name {
  margin-top: 10px;
  padding: 6px 12px;
  background: rgba(56, 189, 248, 0.1);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--accent, #38bdf8);
  font-weight: 600;
}
</style>
