<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Configurador de Órdenes (OF)</h1>
        <p class="section-subtitle">Alta y configuración técnica de piezas para corte de Tubos y Perfiles</p>
      </div>
    </div>

    <!-- Selector de Modo de Fabricación: TUBO vs PERFIL -->
    <div class="mode-selector mb-6">
      <div 
        class="mode-card" 
        :class="{ active: modo === 'tubo' }"
        @click="seleccionarModo('tubo')"
      >
        <div class="mode-icon">⭕</div>
        <div class="mode-info">
          <h3>Tubo / Colector</h3>
          <p>Cobre, Hierro y fontanería. Medidas en pulgadas (1/2", 3/8", 5/8", etc.) con colectores y manguitos.</p>
        </div>
        <div class="mode-badge" v-if="modo === 'tubo'">ACTIVO</div>
      </div>

      <div 
        class="mode-card" 
        :class="{ active: modo === 'perfil' }"
        @click="seleccionarModo('perfil')"
      >
        <div class="mode-icon">📐</div>
        <div class="mode-info">
          <h3>Perfil Estructural</h3>
          <p>Aluminio extruido y perfiles modulares (40x40, 30x30, 20x20, 60x40, etc.) para bastidores y chasis.</p>
        </div>
        <div class="mode-badge profile-badge" v-if="modo === 'perfil'">ACTIVO</div>
      </div>
    </div>

    <div class="configurator-grid">
      <!-- Formulario Principal -->
      <div class="card form-card">
        <div class="card-header">
          <h3 class="card-title">
            {{ modo === 'tubo' ? 'Configuración de Tubo' : 'Configuración de Perfil' }}
          </h3>
          <span class="badge" :class="modo === 'tubo' ? 'badge-cobre' : 'badge-aluminio'">
            {{ modo === 'tubo' ? 'Tubo Cilíndrico' : 'Perfil Modular' }}
          </span>
        </div>

        <form @submit.prevent="guardar">
          <!-- Identificación de la Orden -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">N. Orden de Fabricación (OF) *</label>
              <div class="input-with-button">
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="form.numero" 
                  required 
                  :placeholder="modo === 'tubo' ? 'Ej: OF-TUBO-101' : 'Ej: OF-PERFIL-01'"
                >
                <button type="button" class="btn btn-ghost btn-sm" @click="generarNumeroOF" title="Generar código automático">Auto</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ modo === 'tubo' ? 'Batería / N. Padre' : 'Proyecto / Bastidor' }}</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="form.norden_padre" 
                :placeholder="modo === 'tubo' ? 'Ej: BAT-201' : 'Ej: BASTIDOR-ALPHA'"
              >
            </div>
          </div>

          <!-- Selección de Tipo y Material -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo de Elemento</label>
              <select class="form-select" v-model="form.tipo" @change="alCambiarTipo">
                <template v-if="modo === 'tubo'">
                  <option value="colector">Colector</option>
                  <option value="manguito">Manguito</option>
                  <option value="tubo">Tubo Liso</option>
                </template>
                <template v-else>
                  <option value="perfil ranurado">Perfil Ranurado (Estructural)</option>
                  <option value="tubo cuadrado">Tubo Cuadrado</option>
                  <option value="tubo rectangular">Tubo Rectangular</option>
                  <option value="ángulo L">Ángulo en L</option>
                  <option value="perfil U">Perfil en U</option>
                  <option value="pletina">Pletina Plana</option>
                </template>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Material *</label>
              <select class="form-select" v-model="form.material">
                <template v-if="modo === 'tubo'">
                  <option value="Cobre">Cobre</option>
                  <option value="Hierro">Hierro</option>
                  <option value="Aluminio">Aluminio</option>
                </template>
                <template v-else>
                  <option value="Aluminio">Aluminio</option>
                  <option value="Hierro">Hierro / Acero</option>
                </template>
              </select>
            </div>
          </div>

          <!-- Medida / Sección con Chips de Selección Rápida -->
          <div class="form-group">
            <div class="label-with-presets">
              <label class="form-label">
                {{ modo === 'tubo' ? 'Diámetro Nominal (Pulgadas) *' : 'Sección del Perfil (mm) *' }}
              </label>
              <span class="text-xs text-muted">Clic para seleccionar rápido</span>
            </div>

            <div class="preset-chips mb-2">
              <button 
                type="button"
                v-for="preset in medidasDisponibles" 
                :key="preset"
                class="chip-btn"
                :class="{ active: form.medida === preset }"
                @click="form.medida = preset"
              >
                {{ modo === 'tubo' ? preset + '"' : preset }}
              </button>
            </div>

            <input 
              type="text" 
              class="form-input" 
              v-model="form.medida" 
              required 
              :placeholder="modo === 'tubo' ? 'Ej: 1/2 o escribe personalizada' : 'Ej: 40x40 o 60x40'"
            >
          </div>

          <!-- Dimensiones y Cantidad -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Longitud de Corte (mm) *</label>
              <input 
                type="number" 
                class="form-input" 
                v-model.number="form.longitud" 
                required 
                placeholder="Ej: 3760" 
                min="1"
              >
              <div class="form-hint">Longitud neta de la pieza terminada</div>
            </div>

            <div class="form-group" v-if="modo === 'tubo' && form.tipo === 'colector'">
              <label class="form-label">Longitud Manguito (mm)</label>
              <input 
                type="number" 
                class="form-input" 
                v-model.number="form.longitud_manguito" 
                placeholder="Opcional (Ej: 306)" 
                min="1"
              >
              <div class="form-hint">Manguito asociado al colector</div>
            </div>

            <div class="form-group">
              <label class="form-label">Cantidad a Cortar *</label>
              <input 
                type="number" 
                class="form-input" 
                v-model.number="form.cantidad" 
                required 
                placeholder="Ej: 8" 
                min="1"
              >
            </div>
          </div>

          <!-- Prioridad -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Prioridad de Producción</label>
              <select class="form-select" v-model="form.prioridad">
                <option value="Alta">Alta (Urgente)</option>
                <option value="Normal">Normal</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="mt-6 action-row">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : `Crear Orden de ${modo === 'tubo' ? 'Tubo' : 'Perfil'}` }}
            </button>
            <span v-if="msg" style="color:var(--green,#4ade80);font-size:0.95rem;font-weight:600;">
              ✅ {{ msg }}
            </span>
          </div>
        </form>
      </div>

      <!-- Panel de Previsualización y Análisis en Tiempo Real -->
      <div class="preview-panel">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Previsualizador de Pieza</h3>
            <span class="badge" :class="prioridadBadgeClass">{{ form.prioridad }}</span>
          </div>

          <!-- Render 3D / Diagrama Visual Dinámico -->
          <div class="piece-simulation-box">
            <div 
              class="simulated-piece" 
              :class="[
                simulatedMaterialClass,
                modo === 'perfil' ? 'profile-shape' : 'tube-shape'
              ]"
            >
              <div class="specular-shine"></div>
              <div class="piece-label">
                <strong>{{ form.numero || 'OF-NUEVA' }}</strong>
                <span>{{ form.medida ? (modo === 'tubo' ? form.medida + '"' : form.medida) : '—' }}</span>
                <span>{{ form.longitud ? form.longitud + ' mm' : '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Resumen de Métricas -->
          <div class="metrics-list mt-4">
            <div class="metric-row">
              <span class="metric-title">Metros Lineales (M/L)</span>
              <strong class="metric-value">{{ totalMetrosLineales }} m</strong>
            </div>
            <div class="metric-row">
              <span class="metric-title">Barra Comercial Base</span>
              <span class="metric-value">{{ longitudBarraConfig }} mm</span>
            </div>
            <div class="metric-row">
              <span class="metric-title">Piezas por Barra</span>
              <span class="metric-value">~{{ piezasPorBarra }} u/barra</span>
            </div>
            <div class="metric-row highlight-metric">
              <span class="metric-title">Estimación Barras Mínimas</span>
              <strong class="metric-value" style="color:var(--primary,#38bdf8);">
                {{ barrasEstimadas }} barra{{ barrasEstimadas !== 1 ? 's' : '' }}
              </strong>
            </div>
          </div>

          <div class="preview-footer-tip mt-4">
            <p class="text-xs text-muted">
              💡 <em>{{ modo === 'tubo' 
                ? 'El algoritmo optimizará los cortes agrupándolos con otras piezas de fontanería para minimizar desperdicios.' 
                : 'La optimización de perfiles aplicará la merma de disco de aluminio configurada y priorizará retales disponibles.' 
              }}</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrdenesStore } from '../stores/ordenes'
import { useConfigStore } from '../stores/config'

const store = useOrdenesStore()
const configStore = useConfigStore()

const modo = ref('tubo') // 'tubo' | 'perfil'
const saving = ref(false)
const msg = ref('')

const defaultForm = (modoActual = 'tubo') => ({
  numero: '',
  norden_padre: '',
  tipo: modoActual === 'tubo' ? 'colector' : 'perfil ranurado',
  medida: modoActual === 'tubo' ? '1/2' : '55x55',
  material: modoActual === 'tubo' ? 'Cobre' : 'Aluminio',
  prioridad: 'Normal',
  longitud: null,
  longitud_manguito: null,
  cantidad: 1
})

const form = ref(defaultForm('tubo'))

function seleccionarModo(nuevoModo) {
  modo.value = nuevoModo
  form.value = defaultForm(nuevoModo)
}

function alCambiarTipo() {
  if (modo.value === 'tubo' && form.value.tipo !== 'colector') {
    form.value.longitud_manguito = null
  }
}

const medidasDisponibles = computed(() => {
  if (modo.value === 'tubo') {
    return configStore.tubos.medidas || ['1/2', '3/8', '5/8', '2', '1 5/8']
  } else {
    return configStore.perfiles.secciones || ['55x55', '40x40', '30x30', '20x20', '45x45', '60x40']
  }
})

const longitudBarraConfig = computed(() => {
  return modo.value === 'tubo' 
    ? configStore.tubos.longitud_barra 
    : configStore.perfiles.longitud_barra
})

const totalMetrosLineales = computed(() => {
  if (!form.value.longitud || !form.value.cantidad) return '0.00'
  return ((form.value.longitud * form.value.cantidad) / 1000).toFixed(2)
})

const piezasPorBarra = computed(() => {
  if (!form.value.longitud) return 0
  const merma = modo.value === 'tubo' ? configStore.tubos.merma_corte : configStore.perfiles.merma_corte
  const unit = form.value.longitud + merma
  return Math.floor(longitudBarraConfig.value / unit)
})

const barrasEstimadas = computed(() => {
  if (!form.value.longitud || !form.value.cantidad) return 0
  const ppb = piezasPorBarra.value
  if (ppb <= 0) return Math.ceil(form.value.cantidad)
  return Math.ceil(form.value.cantidad / ppb)
})

const simulatedMaterialClass = computed(() => {
  const m = (form.value.material || '').toLowerCase()
  if (m.includes('cobre') || m === 'cu') return 'mat-copper'
  if (m.includes('aluminio') || m === 'al') return 'mat-aluminum'
  return 'mat-iron'
})

const prioridadBadgeClass = computed(() => {
  const p = (form.value.prioridad || 'Normal').toLowerCase()
  if (p === 'alta') return 'badge-alta'
  if (p === 'baja') return 'badge-baja'
  return 'badge-normal'
})

function generarNumeroOF() {
  const prefijo = modo.value === 'tubo' ? 'OF-TUB' : 'OF-PERF'
  const aleatorio = Math.floor(100 + Math.random() * 900)
  form.value.numero = `${prefijo}-${aleatorio}`
}

async function guardar() {
  if (!form.value.numero || !form.value.medida || !form.value.longitud) return
  saving.value = true
  try {
    await store.agregar({
      ...form.value,
      // Indicador explícito de categoría para facilitar filtrado futuro
      categoria: modo.value, 
      completedCount: 0,
      tiempos_corte: [],
      corte_inicio: null,
      estado: 'pendiente'
    })
    msg.value = `Orden ${form.value.numero} (${modo.value.toUpperCase()}) guardada con éxito`
    const modoPrevio = modo.value
    form.value = defaultForm(modoPrevio)
    setTimeout(() => msg.value = '', 3500)
  } catch (err) {
    alert('Error al guardar: ' + err.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.mode-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-surface, #1e2430);
  border: 2px solid var(--border-color, #2d3748);
  border-radius: 10px;
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.mode-card:hover {
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-2px);
}

.mode-card.active {
  background: rgba(56, 189, 248, 0.08);
  border-color: var(--primary, #38bdf8);
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.2);
}

.mode-icon {
  font-size: 2.2rem;
  line-height: 1;
}

.mode-info h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary, #f8fafc);
}

.mode-info p {
  font-size: 0.82rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.35;
  margin: 0;
}

.mode-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
  padding: 3px 8px;
  border-radius: 4px;
}

.profile-badge {
  background: rgba(163, 230, 53, 0.2);
  color: #a3e635;
  border-color: rgba(163, 230, 53, 0.4);
}

.configurator-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 960px) {
  .configurator-grid {
    grid-template-columns: 1fr;
  }
}

.input-with-button {
  display: flex;
  gap: 8px;
}

.label-with-presets {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  background: var(--bg-body, #0f131a);
  border: 1px solid var(--border-color, #2d3748);
  color: var(--text-secondary, #94a3b8);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.chip-btn:hover {
  border-color: var(--primary, #38bdf8);
  color: #fff;
}

.chip-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: var(--primary, #38bdf8);
  color: #38bdf8;
}

/* Simulación Visual */
.piece-simulation-box {
  background: #090c10;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 30px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);
}

.simulated-piece {
  position: relative;
  width: 90%;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(0,0,0,0.5);
  transition: all 0.3s ease;
}

.tube-shape {
  border-radius: 26px;
}

.profile-shape {
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.15);
}

.specular-shine {
  position: absolute;
  top: 15%;
  left: 5%;
  right: 5%;
  height: 20%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  border-radius: 20px;
  pointer-events: none;
}

.piece-label {
  display: flex;
  gap: 10px;
  align-items: center;
  color: #fff;
  font-size: 0.82rem;
  text-shadow: 0 1px 3px rgba(0,0,0,0.9);
  z-index: 2;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.05em;
}

/* Materiales de Simulación */
.mat-copper {
  background: linear-gradient(180deg, #5a2b18 0%, #d4722a 35%, #ffd5b5 50%, #d4722a 65%, #3d1508 100%);
}

.mat-iron {
  background: linear-gradient(180deg, #12161b 0%, #4f5c6a 35%, #d5dee4 50%, #4f5c6a 65%, #12161b 100%);
}

.mat-aluminum {
  background: linear-gradient(180deg, #334155 0%, #94a3b8 35%, #ffffff 50%, #94a3b8 65%, #334155 100%);
}

/* Métricas del panel */
.metrics-list {
  background: var(--bg-body, #0f131a);
  border: 1px solid var(--border-color, #2d3748);
  border-radius: 6px;
  padding: 12px 14px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 0.88rem;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-title {
  color: var(--text-muted, #94a3b8);
}

.highlight-metric {
  padding-top: 8px;
  font-size: 0.95rem;
}
</style>
