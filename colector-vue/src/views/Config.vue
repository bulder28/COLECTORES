<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Configurador del Sistema</h1>
        <p class="section-subtitle">Ajustes y parámetros de corte para Tubos cilíndricos y Perfiles estructurales</p>
      </div>
      <div class="action-row">
        <button class="btn btn-ghost btn-sm" @click="restaurarValores">Restaurar Valores por Defecto</button>
        <button class="btn btn-primary btn-sm" @click="guardar">Guardar Cambios</button>
      </div>
    </div>

    <!-- Selector de Modo / Pestañas de Configuración -->
    <div class="config-tabs mb-6">
      <button 
        class="config-tab-btn" 
        :class="{ active: tabActiva === 'tubos' }"
        @click="tabActiva = 'tubos'"
      >
        <span class="tab-icon">⭕</span>
        <div class="tab-text">
          <strong>Tubos & Colectores</strong>
          <small>Cobre, Hierro, Diámetros en pulgadas</small>
        </div>
      </button>

      <button 
        class="config-tab-btn" 
        :class="{ active: tabActiva === 'perfiles' }"
        @click="tabActiva = 'perfiles'"
      >
        <span class="tab-icon">📐</span>
        <div class="tab-text">
          <strong>Perfiles Estructurales</strong>
          <small>Aluminio, Secciones modulares en mm</small>
        </div>
      </button>

      <button 
        class="config-tab-btn" 
        :class="{ active: tabActiva === 'sistema' }"
        @click="tabActiva = 'sistema'"
      >
        <span class="tab-icon">⚙️</span>
        <div class="tab-text">
          <strong>Sistema & Cloud</strong>
          <small>Conexión Firebase y parámetros</small>
        </div>
      </button>
    </div>

    <!-- Pestaña 1: Configuración de TUBOS -->
    <div v-if="tabActiva === 'tubos'" class="card config-card">
      <div class="card-header">
        <h3 class="card-title">Parámetros de Fabricación de Tubos</h3>
        <span class="badge badge-cobre">Cobre / Hierro</span>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Longitud de Barra Estándar (mm)</label>
          <input type="number" class="form-input" v-model.number="form.tubos.longitud_barra" min="1000" step="500">
          <div class="form-hint">Longitud comercial habitual (por defecto: 6000 mm)</div>
        </div>
        <div class="form-group">
          <label class="form-label">Merma de Sierra de Tubo (mm)</label>
          <input type="number" class="form-input" v-model.number="form.tubos.merma_corte" min="0" step="0.5">
          <div class="form-hint">Espesor del corte de la sierra de cinta / tronzadora</div>
        </div>
        <div class="form-group">
          <label class="form-label">Retal Mínimo Reutilizable (mm)</label>
          <input type="number" class="form-input" v-model.number="form.tubos.retal_minimo" min="100" step="100">
          <div class="form-hint">Sobrantes mayores a esta medida se almacenan en el rack</div>
        </div>
      </div>

      <div class="form-group mt-4">
        <label class="form-label">Diámetros de Tubo Habituales (Pulgadas)</label>
        <div class="tag-input-container">
          <span v-for="(med, idx) in form.tubos.medidas" :key="idx" class="tag-item">
            {{ med }}"
            <button type="button" class="tag-remove" @click="eliminarMedidaTubo(idx)">×</button>
          </span>
          <div class="tag-add-box">
            <input 
              type="text" 
              class="tag-add-input" 
              v-model="nuevaMedidaTubo" 
              placeholder="+ Nueva (ej: 7/8)"
              @keydown.enter.prevent="agregarMedidaTubo"
            >
            <button type="button" class="btn btn-xs btn-primary" @click="agregarMedidaTubo">Añadir</button>
          </div>
        </div>
      </div>

      <div class="form-group mt-4">
        <label class="form-label">Materiales de Tubo Habilitados</label>
        <div class="chips-row">
          <label v-for="mat in ['Cobre', 'Hierro', 'Aluminio', 'Acero Inox']" :key="mat" class="chip-checkbox">
            <input 
              type="checkbox" 
              :value="mat" 
              v-model="form.tubos.materiales"
            >
            <span>{{ mat }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Pestaña 2: Configuración de PERFILES -->
    <div v-if="tabActiva === 'perfiles'" class="card config-card">
      <div class="card-header">
        <h3 class="card-title">Parámetros de Corte de Perfiles Estructurales</h3>
        <span class="badge badge-aluminio">Aluminio & Estructuras</span>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Longitud Comercial de Barra (mm)</label>
          <input type="number" class="form-input" v-model.number="form.perfiles.longitud_barra" min="1000" step="500">
          <div class="form-hint">Barras estándar de extrusión (ej: 6000 mm o 6500 mm)</div>
        </div>
        <div class="form-group">
          <label class="form-label">Merma Disco Tronzadora Aluminio (mm)</label>
          <input type="number" class="form-input" v-model.number="form.perfiles.merma_corte" min="0" step="0.5">
          <div class="form-hint">Grosor de disco de corte para perfiles (habitual: 3.5 mm)</div>
        </div>
        <div class="form-group">
          <label class="form-label">Retal Mínimo de Perfil (mm)</label>
          <input type="number" class="form-input" v-model.number="form.perfiles.retal_minimo" min="100" step="100">
          <div class="form-hint">Longitud mínima para devolver el retal a la estantería</div>
        </div>
      </div>

      <div class="form-group mt-4">
        <label class="form-label">Secciones de Perfil en Catálogo (mm)</label>
        <div class="tag-input-container">
          <span v-for="(sec, idx) in form.perfiles.secciones" :key="idx" class="tag-item tag-item-profile">
            {{ sec }}
            <button type="button" class="tag-remove" @click="eliminarSeccionPerfil(idx)">×</button>
          </span>
          <div class="tag-add-box">
            <input 
              type="text" 
              class="tag-add-input" 
              v-model="nuevaSeccionPerfil" 
              placeholder="+ Nueva (ej: 45x45)"
              @keydown.enter.prevent="agregarSeccionPerfil"
            >
            <button type="button" class="btn btn-xs btn-primary" @click="agregarSeccionPerfil">Añadir</button>
          </div>
        </div>
      </div>

      <div class="form-group mt-4">
        <label class="form-label">Tipos de Perfil Habilitados</label>
        <div class="chips-row">
          <label v-for="tipo in ['perfil ranurado', 'tubo cuadrado', 'tubo rectangular', 'ángulo L', 'perfil U', 'pletina']" :key="tipo" class="chip-checkbox">
            <input 
              type="checkbox" 
              :value="tipo" 
              v-model="form.perfiles.tipos"
            >
            <span style="text-transform: capitalize;">{{ tipo }}</span>
          </label>
        </div>
      </div>

      <div class="form-group mt-4">
        <label class="form-label">Materiales de Perfil</label>
        <div class="chips-row">
          <label v-for="mat in ['Aluminio', 'Hierro / Acero', 'PVC / Composite']" :key="mat" class="chip-checkbox">
            <input 
              type="checkbox" 
              :value="mat" 
              v-model="form.perfiles.materiales"
            >
            <span>{{ mat }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Pestaña 3: Configuración de SISTEMA -->
    <div v-if="tabActiva === 'sistema'" class="card config-card">
      <div class="card-header">
        <h3 class="card-title">Infraestructura y Conexión</h3>
      </div>
      <div class="form-group">
        <label class="form-label">Proyecto Firebase</label>
        <p class="text-sm font-mono" style="color:var(--text-accent,#38bdf8);">colectores-7284c</p>
      </div>
      <div class="form-group">
        <label class="form-label">Estado de Sincronización</label>
        <p class="text-sm">
          <span class="status-dot" :class="{ connected: store.connected }" style="display:inline-block;vertical-align:middle;margin-right:6px;"></span>
          {{ store.connected ? 'Conectado en tiempo real a Firestore' : 'Conectando...' }}
        </p>
      </div>
      <div class="form-group">
        <label class="form-label">Reglas de Seguridad</label>
        <p class="text-sm" style="color:var(--green,#4ade80);">✅ Modo producción — Reglas con validación de datos activas en Firestore</p>
      </div>
      <div class="form-group mt-4">
        <label class="form-label">Motor de Algoritmo Predeterminado</label>
        <select class="form-select" v-model="form.sistema.algoritmo_predeterminado">
          <option value="bfd">🎯 Best Fit Decreasing (BFD - Mínimo Desperdicio)</option>
          <option value="knapsack">🧮 Knapsack Dinámico (Ajuste Matemático 0-1)</option>
          <option value="genetic">🧬 Algoritmo Genético (Metaheurística IA)</option>
          <option value="kitting">📦 Kitting Lean (Cero Cuellos de Botella / Por Batería)</option>
          <option value="scrap">♻️ Scrap First (Reutilización de Retales de Stock)</option>
          <option value="ffd">⚡ First Fit Decreasing (FFD - Clásico Rápido)</option>
          <option value="wfd">⚖️ Worst Fit (WFD - Balanceo y Retales Grandes)</option>
        </select>
        <div class="form-hint">Algoritmo que se seleccionará por defecto al optimizar cortes</div>
      </div>
    </div>

    <!-- Barra de acción flotante / feedback -->
    <div class="mt-6 action-row" style="align-items: center; justify-content: flex-end;">
      <span v-if="saved" style="color:var(--green,#4ade80);font-weight:600;font-size:0.95rem;margin-right:12px;">
        ✅ Configuración guardada correctamente
      </span>
      <button class="btn btn-primary" @click="guardar">Guardar Configuración</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useConfigStore } from '../stores/config'
import { useOrdenesStore } from '../stores/ordenes'

const configStore = useConfigStore()
const store = useOrdenesStore()

const tabActiva = ref('tubos')
const saved = ref(false)

// Campos para añadir tags interactivos
const nuevaMedidaTubo = ref('')
const nuevaSeccionPerfil = ref('')

// Form reactivo inicializado desde el store
const form = ref({
  tubos: {
    longitud_barra: configStore.tubos.longitud_barra,
    merma_corte: configStore.tubos.merma_corte,
    retal_minimo: configStore.tubos.retal_minimo,
    medidas: [...configStore.tubos.medidas],
    materiales: [...configStore.tubos.materiales],
    tipos: [...configStore.tubos.tipos]
  },
  perfiles: {
    longitud_barra: configStore.perfiles.longitud_barra,
    merma_corte: configStore.perfiles.merma_corte,
    retal_minimo: configStore.perfiles.retal_minimo,
    secciones: [...configStore.perfiles.secciones],
    materiales: [...configStore.perfiles.materiales],
    tipos: [...configStore.perfiles.tipos]
  },
  sistema: {
    algoritmo_predeterminado: configStore.sistema?.algoritmo_predeterminado || 'bfd'
  }
})

function agregarMedidaTubo() {
  const v = nuevaMedidaTubo.value.trim().replace(/"/g, '')
  if (v && !form.value.tubos.medidas.includes(v)) {
    form.value.tubos.medidas.push(v)
    nuevaMedidaTubo.value = ''
  }
}

function eliminarMedidaTubo(idx) {
  form.value.tubos.medidas.splice(idx, 1)
}

function agregarSeccionPerfil() {
  const v = nuevaSeccionPerfil.value.trim().toLowerCase()
  if (v && !form.value.perfiles.secciones.includes(v)) {
    form.value.perfiles.secciones.push(v)
    nuevaSeccionPerfil.value = ''
  }
}

function eliminarSeccionPerfil(idx) {
  form.value.perfiles.secciones.splice(idx, 1)
}

function guardar() {
  configStore.guardarConfig({
    tubos: form.value.tubos,
    perfiles: form.value.perfiles,
    sistema: form.value.sistema
  })
  saved.value = true
  setTimeout(() => saved.value = false, 2500)
}

function restaurarValores() {
  if (confirm('¿Restaurar todos los parámetros de tubos y perfiles a los valores de fábrica?')) {
    configStore.resetDefaults()
    form.value.tubos = { ...configStore.tubos }
    form.value.perfiles = { ...configStore.perfiles }
    form.value.sistema = { ...configStore.sistema }
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  }
}
</script>

<style scoped>
.config-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.config-tab-btn {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface, #1e2430);
  border: 1px solid var(--border-color, #2d3748);
  border-radius: 8px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  color: var(--text-secondary, #94a3b8);
}

.config-tab-btn:hover {
  border-color: var(--primary, #38bdf8);
  transform: translateY(-1px);
}

.config-tab-btn.active {
  background: rgba(56, 189, 248, 0.08);
  border-color: var(--primary, #38bdf8);
  color: var(--text-primary, #f8fafc);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
}

.tab-icon {
  font-size: 1.6rem;
}

.tab-text strong {
  display: block;
  font-size: 1rem;
  color: inherit;
}

.tab-text small {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted, #64748b);
  margin-top: 2px;
}

.config-card {
  max-width: 860px;
  animation: fadeIn 0.3s ease;
}

.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: var(--bg-body, #0f131a);
  border: 1px solid var(--border-color, #2d3748);
  border-radius: 6px;
  min-height: 48px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.tag-item-profile {
  background: rgba(163, 230, 53, 0.15);
  color: #a3e635;
  border-color: rgba(163, 230, 53, 0.3);
}

.tag-remove {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-add-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tag-add-input {
  background: transparent;
  border: 1px solid var(--border-color, #334155);
  color: var(--text-primary, #fff);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.82rem;
  width: 140px;
}

.tag-add-input:focus {
  outline: none;
  border-color: var(--primary, #38bdf8);
}

.chips-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.chip-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-body, #0f131a);
  border: 1px solid var(--border-color, #2d3748);
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text-secondary, #cbd5e1);
  transition: all 0.2s;
}

.chip-checkbox input[type="checkbox"] {
  accent-color: var(--primary, #38bdf8);
}

.chip-checkbox:hover {
  border-color: var(--primary, #38bdf8);
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
