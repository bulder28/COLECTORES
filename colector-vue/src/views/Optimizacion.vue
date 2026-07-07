<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Optimización de Cortes</h1>
        <p class="section-subtitle">Minimiza desperdicio agrupando cortes en tubos</p>
      </div>
    </div>

    <div class="card mb-6" style="max-width:600px;">
      <h3 class="card-title mb-4">Parámetros</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Longitud tubo estándar (mm)</label>
          <input type="number" class="form-input" v-model.number="stockLength">
        </div>
        <div class="form-group">
          <label class="form-label">Merma por corte (mm)</label>
          <input type="number" class="form-input" v-model.number="mermaTubo">
        </div>
      </div>
      <button class="btn btn-primary" @click="optimizar">Ejecutar Optimización</button>
    </div>

    <template v-if="results">
      <!-- Summary -->
      <div class="stats-grid mb-6">
        <div class="stat-card teal"><div class="stat-icon">🔧</div><div class="stat-value">{{ results.totalTubos }}</div><div class="stat-label">Tubos necesarios</div></div>
        <div class="stat-card green"><div class="stat-icon">✂️</div><div class="stat-value">{{ results.totalCortes }}</div><div class="stat-label">Total cortes</div></div>
        <div class="stat-card amber"><div class="stat-icon">📏</div><div class="stat-value">{{ (results.totalDesperdicio / 1000).toFixed(2) }}m</div><div class="stat-label">Desperdicio total</div></div>
        <div class="stat-card" :class="parseFloat(results.porcentajeDesperdicio) > 15 ? 'red' : 'purple'">
          <div class="stat-icon">📊</div><div class="stat-value">{{ results.porcentajeDesperdicio }}%</div><div class="stat-label">% Desperdicio</div>
        </div>
      </div>

      <!-- Groups -->
      <div v-for="grupo in results.grupos" :key="`${grupo.medida}-${grupo.material}`" class="optimization-result">
        <h3>
          <span class="badge" :class="grupo.material === 'Cobre' ? 'badge-cobre' : 'badge-hierro'" style="margin-right:8px;">{{ grupo.material }}</span>
          Medida: {{ grupo.medida }}" — {{ grupo.tubosCount }} tubo{{ grupo.tubosCount !== 1 ? 's' : '' }} —
          Desperdicio: {{ (grupo.desperdicio / 1000).toFixed(2) }}m
        </h3>
        <div v-for="(tubo, idx) in grupo.tubos" :key="idx" class="cut-visual">
          <strong>Tubo {{ idx + 1 }} — Aprovechamiento: {{ tubo.aprovechamiento }}%</strong>
          <div class="cut-row">
            <div v-for="corte in tubo.cortes" :key="`${corte.of}-${corte.longitud}`"
              class="cut-bar"
              :style="`width:${Math.max((corte.longitud / stockLength) * 100, 5)}%`"
              :title="`${corte.of} | ${corte.tipo} | ${corte.longitud}mm | ${corte.prioridad}`">
              {{ corte.of }}<br>{{ corte.longitud }}mm
            </div>
            <div v-if="tubo.desperdicio > 0" class="cut-bar waste"
              :style="`width:${Math.max((tubo.desperdicio / stockLength) * 100, 3)}%`"
              :title="`Desperdicio: ${tubo.desperdicio}mm`">
              {{ tubo.desperdicio }}mm
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOrdenesStore } from '../stores/ordenes'

const store = useOrdenesStore()
const stockLength = ref(6000)
const mermaTubo = ref(3)
const results = ref(null)

function optimizar() {
  if (!store.ordenes.length) return
  const ordenes = store.ordenes
  const grupos = {}
  ordenes.forEach(of => {
    const pend = Math.max(0, (of.cantidad || 0) - (of.completedCount || 0))
    if (pend <= 0) return
    const key = `${of.medida}-${(of.material || 'Cobre')}`
    if (!grupos[key]) grupos[key] = { medida: of.medida, material: of.material, cortes: [] }
    for (let i = 0; i < pend; i++) {
      grupos[key].cortes.push({ of: of.numero, longitud: of.longitud || 0, tipo: of.tipo || 'colector', prioridad: of.prioridad || 'Normal' })
    }
  })

  const PO = { Alta: 3, Normal: 2, Baja: 1 }
  let totalTubos = 0, totalDesperdicio = 0, totalCortes = 0
  const resultados = []

  for (const grupo of Object.values(grupos)) {
    grupo.cortes.sort((a, b) => (PO[b.prioridad] || 2) - (PO[a.prioridad] || 2) || b.longitud - a.longitud)
    const tubos = []
    grupo.cortes.forEach(corte => {
      let placed = false
      for (const tubo of tubos) {
        if (stockLength.value - tubo.usado - mermaTubo.value >= corte.longitud) {
          tubo.cortes.push(corte); tubo.usado += corte.longitud + mermaTubo.value; placed = true; break
        }
      }
      if (!placed) tubos.push({ cortes: [corte], usado: corte.longitud + mermaTubo.value })
    })
    let desp = 0
    tubos.forEach(t => { t.desperdicio = stockLength.value - t.usado; t.aprovechamiento = ((t.usado / stockLength.value) * 100).toFixed(1); desp += t.desperdicio })
    totalTubos += tubos.length; totalDesperdicio += desp; totalCortes += grupo.cortes.length
    resultados.push({ medida: grupo.medida, material: grupo.material, tubos, tubosCount: tubos.length, desperdicio: desp, cortesCount: grupo.cortes.length })
  }

  results.value = {
    grupos: resultados, totalTubos, totalDesperdicio, totalCortes,
    porcentajeDesperdicio: totalTubos > 0 ? ((totalDesperdicio / (totalTubos * stockLength.value)) * 100).toFixed(1) : '0.0'
  }
}
</script>
