<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Órdenes de Trabajo</h1>
        <p class="section-subtitle">Gestiona y controla el progreso de cortes</p>
      </div>
      <div class="action-row">
        <RouterLink to="/import" class="btn btn-primary btn-sm">Importar</RouterLink>
        <button class="btn btn-danger btn-sm" @click="eliminarTodas">Eliminar Todas</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-wrapper">
        <input type="text" class="form-input search-input" v-model="search" placeholder="Buscar OF, tipo, medida...">
      </div>
      <select class="form-select" v-model="filterMaterial">
        <option value="">Todo Material</option>
        <option value="Cobre">Cobre</option>
        <option value="Hierro">Hierro</option>
      </select>
      <select class="form-select" v-model="filterPrioridad">
        <option value="">Toda Prioridad</option>
        <option value="Alta">Alta</option>
        <option value="Normal">Normal</option>
        <option value="Baja">Baja</option>
      </select>
      <select class="form-select" v-model="filterEstado">
        <option value="">Todo Estado</option>
        <option value="pendiente">Pendiente</option>
        <option value="completado">Completado</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>OF</th>
              <th>N.Padre</th>
              <th>Descripción</th>
              <th>Medida</th>
              <th>Material</th>
              <th>L.Colector</th>
              <th>L.Manguito</th>
              <th>Cant.</th>
              <th>Completados</th>
              <th>Prioridad</th>
              <th>Equipo</th>
              <th>⏱ Timer</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtradas.length === 0">
              <td colspan="13">
                <div class="table-empty">
                  <div class="table-empty-text">
                    {{ store.ordenes.length === 0 ? 'No hay órdenes de trabajo' : 'No hay resultados' }}
                  </div>
                </div>
              </td>
            </tr>
            <OrdenRow
              v-for="of in filtradas"
              :key="of.id"
              :orden="of"
              :equipo-info="equipoInfo(of.numero)"
              @incrementar="store.incrementarCompletados(of.id)"
              @decrementar="store.decrementarCompletados(of.id)"
              @toggle-timer="store.toggleTimer(of.id)"
              @eliminar="confirmarEliminar(of.id)"
            />
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useOrdenesStore } from '../stores/ordenes'
import OrdenRow from '../components/OrdenRow.vue'

const store = useOrdenesStore()
const search = ref('')
const filterMaterial = ref('')
const filterPrioridad = ref('')
const filterEstado = ref('')

const filtradas = computed(() => {
  let list = [...store.ordenes]
  const s = search.value.toLowerCase()
  if (s) list = list.filter(o =>
    (o.numero || '').toLowerCase().includes(s) ||
    (o.tipo || '').toLowerCase().includes(s) ||
    (o.medida || '').toLowerCase().includes(s) ||
    (o.norden_padre || '').toLowerCase().includes(s)
  )
  if (filterMaterial.value) list = list.filter(o =>
    (o.material || '').toLowerCase().includes(filterMaterial.value.toLowerCase())
  )
  if (filterPrioridad.value) list = list.filter(o => o.prioridad === filterPrioridad.value)
  if (filterEstado.value === 'completado') list = list.filter(o => (o.completedCount || 0) >= (o.cantidad || 0) && (o.cantidad || 0) > 0)
  if (filterEstado.value === 'pendiente') list = list.filter(o => (o.completedCount || 0) < (o.cantidad || 0))
  return list
})

function equipoInfo(numero) {
  const items = store.ordenes.filter(o => o.numero === numero)
  const total = items.reduce((s, i) => s + (i.cantidad || 0), 0)
  const done = items.reduce((s, i) => s + (i.completedCount || 0), 0)
  return { total, done, completo: done >= total && total > 0 }
}

async function confirmarEliminar(id) {
  if (confirm('¿Eliminar esta orden?')) await store.eliminar(id)
}

async function eliminarTodas() {
  if (confirm('¿Eliminar TODAS las órdenes? Esta acción no se puede deshacer.')) {
    await store.eliminarTodas()
  }
}
</script>
