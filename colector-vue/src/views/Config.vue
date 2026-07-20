<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Configuración</h1>
        <p class="section-subtitle">Ajustes generales de la plataforma</p>
      </div>
    </div>

    <div class="card" style="max-width:700px;">
      <form @submit.prevent="guardar">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Longitud estándar de tubos (mm)</label>
            <input type="number" class="form-input" v-model.number="form.longitud_tubo_estandar">
          </div>
          <div class="form-group">
            <label class="form-label">Merma por corte (mm)</label>
            <input type="number" class="form-input" v-model.number="form.merma_tubo">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Medidas disponibles</label>
          <input type="text" class="form-input" v-model="form.medidas_str">
          <div class="form-hint">Separadas por coma</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Materiales</label>
            <input type="text" class="form-input" v-model="form.materiales_str">
            <div class="form-hint">Separados por coma</div>
          </div>
          <div class="form-group">
            <label class="form-label">Tipos de pieza</label>
            <input type="text" class="form-input" v-model="form.tipos_str">
            <div class="form-hint">Separados por coma</div>
          </div>
        </div>
        <div class="mt-6 action-row">
          <button type="submit" class="btn btn-primary">Guardar Configuración</button>
          <span v-if="saved" style="color:var(--green,#4ade80);">✅ Guardado</span>
        </div>
      </form>
    </div>

    <div class="card mt-6" style="max-width:700px;">
      <h3 class="card-title mb-4">Conexión Firebase</h3>
      <div class="form-group">
        <label class="form-label">Proyecto</label>
        <p class="text-sm">colectores-7284c</p>
      </div>
      <div class="form-group">
        <label class="form-label">Estado</label>
        <p class="text-sm">
          <span class="status-dot" :class="{ connected: store.connected }" style="display:inline-block;vertical-align:middle;margin-right:6px;"></span>
          {{ store.connected ? 'Conectado a Firestore' : 'Conectando...' }}
        </p>
      </div>
      <div class="form-group">
        <label class="form-label">Reglas de seguridad</label>
        <p class="text-sm" style="color:var(--green,#4ade80);">✅ Modo producción — Reglas con validación de datos activas</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOrdenesStore } from '../stores/ordenes'

const store = useOrdenesStore()
const saved = ref(false)

const form = ref({
  longitud_tubo_estandar: 6000,
  merma_tubo: 3,
  medidas_str: '1/2, 3/8, 5/8, 2, 1 5/8',
  materiales_str: 'Cobre, Hierro',
  tipos_str: 'colector, manguito'
})

function guardar() {
  // Config stored locally for now — can extend to Firestore
  localStorage.setItem('colector_config', JSON.stringify(form.value))
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}
</script>
