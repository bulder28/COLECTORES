<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Nueva Orden de Trabajo</h1>
        <p class="section-subtitle">Añadir una OF manualmente</p>
      </div>
    </div>
    <div class="card" style="max-width:700px;">
      <form @submit.prevent="guardar">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">OF / Número *</label>
            <input type="text" class="form-input" v-model="form.numero" required placeholder="Ej: OF-001">
          </div>
          <div class="form-group">
            <label class="form-label">N. Orden Padre</label>
            <input type="text" class="form-input" v-model="form.norden_padre" placeholder="Opcional">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" v-model="form.tipo">
              <option value="colector">Colector</option>
              <option value="manguito">Manguito</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Medida *</label>
            <select class="form-select" v-model="form.medida">
              <option value="1/2">1/2"</option><option value="3/8">3/8"</option>
              <option value="5/8">5/8"</option><option value="2">2"</option>
              <option value="1 5/8">1 5/8"</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Material *</label>
            <select class="form-select" v-model="form.material">
              <option value="Cobre">Cobre</option>
              <option value="Hierro">Hierro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prioridad</label>
            <select class="form-select" v-model="form.prioridad">
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Longitud Colector (mm) *</label>
            <input type="number" class="form-input" v-model.number="form.longitud" required placeholder="Ej: 1460" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Longitud Manguito (mm)</label>
            <input type="number" class="form-input" v-model.number="form.longitud_manguito" placeholder="Ej: 306" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad *</label>
            <input type="number" class="form-input" v-model.number="form.cantidad" required placeholder="Ej: 2" min="1">
          </div>
        </div>
        <div class="mt-4 action-row">
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Guardando...' : 'Añadir Orden' }}</button>
          <span v-if="msg" style="color:var(--green,#4ade80);font-size:0.9rem;">✅ {{ msg }}</span>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOrdenesStore } from '../stores/ordenes'

const store = useOrdenesStore()
const saving = ref(false)
const msg = ref('')

const defaultForm = () => ({
  numero: '', norden_padre: '', tipo: 'colector', medida: '1/2',
  material: 'Cobre', prioridad: 'Normal', longitud: null,
  longitud_manguito: null, cantidad: 1
})

const form = ref(defaultForm())

async function guardar() {
  if (!form.value.numero || !form.value.medida || !form.value.longitud) return
  saving.value = true
  try {
    await store.agregar({
      ...form.value,
      completedCount: 0, tiempos_corte: [], corte_inicio: null, estado: 'pendiente'
    })
    msg.value = `Orden ${form.value.numero} añadida`
    form.value = defaultForm()
    setTimeout(() => msg.value = '', 3000)
  } finally {
    saving.value = false
  }
}
</script>
