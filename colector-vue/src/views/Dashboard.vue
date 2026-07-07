<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Dashboard</h1>
        <p class="section-subtitle">Vista general del estado de producción</p>
      </div>
      <div class="action-row">
        <RouterLink to="/import" class="btn btn-primary">Importar OFs</RouterLink>
        <RouterLink to="/optimizacion" class="btn btn-secondary">Optimizar Cortes</RouterLink>
      </div>
    </div>

    <!-- Cyberpunk Dashboard -->
    <div class="cyber-dashboard">
      <Gauge 
        :value="porcentajeAvance" 
        :max="100" 
        label="Progreso Total" 
        unit="%" 
        color="#00d2ff" 
      />
      <Gauge 
        :value="cortesRealizados" 
        :max="store.totalCortes || cortesRealizados + cortesPendientes || 1" 
        label="Cortes Hechos" 
        unit="u" 
        color="#00ffaa" 
      />
      <Gauge 
        :value="94" 
        :max="100" 
        label="Aprov. Material" 
        unit="%" 
        color="#ffaa00" 
      />
    </div>

    <!-- Demostración de Tubos 3D -->
    <div class="card" style="margin-bottom: 30px;">
      <div class="card-header"><h3 class="card-title">Previsualización de Cortes Físicos</h3></div>
      <div style="padding: 20px;">
        <BarVisualizer :bar="mockCobre" />
        <BarVisualizer :bar="mockHierro" />
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card teal">
        <div class="stat-icon">📋</div>
        <div class="stat-value">{{ store.totalOF }}</div>
        <div class="stat-label">Órdenes de Trabajo</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">🏭</div>
        <div class="stat-value">{{ store.uniqueEquipos.length }}</div>
        <div class="stat-label">Equipos</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ equiposCompletos }}</div>
        <div class="stat-label">Equipos Completados</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon">✂️</div>
        <div class="stat-value">{{ cortesPendientes }}</div>
        <div class="stat-label">Cortes Pendientes</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">{{ cortesRealizados }}</div>
        <div class="stat-label">Cortes Realizados</div>
      </div>
      <div class="stat-card pink">
        <div class="stat-icon">⏱</div>
        <div class="stat-value">{{ formatDuration(store.tiempoMedioMs) }}</div>
        <div class="stat-label">Tiempo Medio / Corte</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🔴</div>
        <div class="stat-value">{{ store.metrosPendientes.cobre }} m</div>
        <div class="stat-label">Metros Cobre Pend.</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">⚫</div>
        <div class="stat-value">{{ store.metrosPendientes.hierro }} m</div>
        <div class="stat-label">Metros Hierro Pend.</div>
      </div>
    </div>

    <!-- Recent orders -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Últimas Órdenes</h3>
        <RouterLink to="/ordenes" class="btn btn-ghost btn-sm">Ver todas →</RouterLink>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>OF</th><th>N.Padre</th><th>Descripción</th>
              <th>Medida</th><th>Material</th>
              <th>L.Colector</th><th>L.Manguito</th>
              <th>Cant.</th><th>Progreso</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="9"><div class="table-empty"><div class="table-empty-text">Cargando...</div></div></td>
            </tr>
            <tr v-else-if="recentOrdenes.length === 0">
              <td colspan="9"><div class="table-empty"><div class="table-empty-text">Sin órdenes de trabajo</div></div></td>
            </tr>
            <tr v-for="of in recentOrdenes" :key="of.id">
              <td><strong>{{ of.numero }}</strong></td>
              <td><small class="text-muted">{{ of.norden_padre || '—' }}</small></td>
              <td :title="of.tipo" style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ formatTipo(of.tipo) }}</td>
              <td>{{ of.medida }}"</td>
              <td><span class="badge" :class="materialClass(of.material)">{{ of.material }}</span></td>
              <td>{{ of.longitud || 0 }}</td>
              <td>{{ of.longitud_manguito || '—' }}</td>
              <td>{{ of.cantidad || 0 }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="text-sm">{{ of.completedCount || 0 }}/{{ of.cantidad || 0 }}</span>
                  <div class="progress-bar" style="width:50px;">
                    <div class="progress-fill" :style="`width:${progress(of)}%`"></div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useOrdenesStore } from '../stores/ordenes'
import Gauge from '../components/Gauge.vue'
import BarVisualizer from '../components/BarVisualizer.vue'

const store = useOrdenesStore()

// Mock data para ver el tubo 3D
const mockCobre = {
  id: "BAR-001",
  isNew: true,
  material: "Cobre",
  tubSize: "1 5/8",
  originalLength: 6000,
  remaining: 1800,
  cuts: [
    { length: 1500, orderId: "OF-1001" },
    { length: 1500, orderId: "OF-1002" },
    { length: 1200, orderId: "OF-1003" }
  ],
  newScrapGenerated: true
};

const mockHierro = {
  id: "USED-SCRAP-002",
  isNew: false,
  material: "Hierro",
  tubSize: "2",
  originalLength: 3000,
  remaining: 400,
  cuts: [
    { length: 1600, orderId: "OF-1020" },
    { length: 1000, orderId: "OF-1021" }
  ],
  newScrapGenerated: false
};


const recentOrdenes = computed(() => store.ordenes.slice(0, 8))

const equiposCompletos = computed(() => {
  return store.uniqueEquipos.filter(num => {
    const items = store.ordenes.filter(o => o.numero === num)
    const total = items.reduce((s, i) => s + (i.cantidad || 0), 0)
    const done = items.reduce((s, i) => s + (i.completedCount || 0), 0)
    return done >= total && total > 0
  }).length
})

const cortesPendientes = computed(() =>
  store.ordenes.reduce((sum, o) => sum + Math.max(0, (o.cantidad || 0) - (o.completedCount || 0)), 0)
)
const cortesRealizados = computed(() =>
  store.ordenes.reduce((sum, o) => sum + (o.completedCount || 0), 0)
)

const porcentajeAvance = computed(() => {
  const total = cortesPendientes.value + cortesRealizados.value;
  if (total === 0) return 0;
  return (cortesRealizados.value / total) * 100;
})

const progress = (of) => (of.cantidad || 0) > 0 ? ((of.completedCount || 0) / of.cantidad) * 100 : 0

function materialClass(m) {
  const k = (m || '').toLowerCase()
  return k.includes('cobre') || k === 'cu' ? 'badge-cobre' : 'badge-hierro'
}

function formatTipo(tipo) {
  if (!tipo) return '—'
  const t = tipo.toLowerCase()
  if (t === 'colector' || t === 'manguito') return tipo
  if (/^cd-|colector/i.test(tipo)) return 'Colector'
  if (/^s-|manguito|solda/i.test(tipo)) return 'Manguito'
  if (/^semi/i.test(tipo)) return 'Semielaborado'
  return tipo.length > 20 ? tipo.substring(0, 18) + '…' : tipo
}

function formatDuration(ms) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  return m === 0 ? `${s}s` : `${m}m ${s % 60}s`
}
</script>

<style scoped>
.cyber-dashboard {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  justify-content: space-around;
}
</style>
