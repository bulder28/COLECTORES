<template>
  <tr :class="{ completed: isComplete }">
    <td><strong>{{ orden.numero }}</strong></td>
    <td><small class="text-muted">{{ orden.norden_padre || '—' }}</small></td>
    <td :title="orden.tipo" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
      {{ tipoCorto }}
    </td>
    <td>{{ orden.medida }}"</td>
    <td><span class="badge" :class="materialClass">{{ orden.material }}</span></td>
    <td>{{ orden.longitud || 0 }}</td>
    <td>{{ orden.longitud_manguito || '—' }}</td>
    <td>{{ orden.cantidad || 0 }}</td>

    <!-- Completion controls -->
    <td>
      <div class="completion-cell">
        <div class="completion-controls">
          <button class="btn btn-ghost btn-icon btn-xs" @click="$emit('decrementar')" :disabled="completados <= 0">−</button>
          <span class="completion-count">{{ completados }}</span>
          <button class="btn btn-primary btn-icon btn-xs" @click="$emit('incrementar')" :disabled="isComplete">+</button>
        </div>
        <div class="progress-bar" style="width:60px;">
          <div class="progress-fill" :style="`width:${progress}%`"></div>
        </div>
      </div>
    </td>

    <td><span class="badge" :class="prioridadClass">{{ orden.prioridad || 'Normal' }}</span></td>

    <!-- Equipo badge -->
    <td>
      <span class="badge" :class="equipoInfo.completo ? 'badge-completado' : 'badge-pendiente'">
        {{ equipoInfo.completo ? 'COMPLETO' : `${equipoInfo.done}/${equipoInfo.total}` }}
      </span>
    </td>

    <!-- Live timer -->
    <td>
      <span :style="timerStyle">{{ timerDisplay }}</span>
    </td>

    <!-- Actions -->
    <td>
      <div class="action-row gap-2">
        <button class="btn btn-ghost btn-icon btn-xs"
          @click="$emit('toggle-timer')"
          :title="orden.corte_inicio ? 'Pausar timer' : 'Iniciar timer'"
          :style="orden.corte_inicio ? 'color:var(--amber,#f59e0b)' : ''">
          <svg v-if="orden.corte_inicio" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
        <button class="btn btn-ghost btn-icon btn-xs" @click="$emit('eliminar')" style="color:var(--red)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  orden: { type: Object, required: true },
  equipoInfo: { type: Object, default: () => ({ total: 0, done: 0, completo: false }) }
})
defineEmits(['incrementar', 'decrementar', 'toggle-timer', 'eliminar'])

// Live elapsed time (updates every second)
const elapsed = ref(0)
let _interval = null

function tick() {
  elapsed.value = props.orden.corte_inicio ? Date.now() - props.orden.corte_inicio : 0
}

onMounted(() => {
  tick()
  _interval = setInterval(tick, 1000)
})
onUnmounted(() => clearInterval(_interval))

function formatDuration(ms) {
  if (!ms) return null
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  return m === 0 ? `${s}s` : `${m}m ${s % 60}s`
}

const completados = computed(() => props.orden.completedCount || 0)
const isComplete = computed(() => completados.value >= (props.orden.cantidad || 0) && (props.orden.cantidad || 0) > 0)
const progress = computed(() => (props.orden.cantidad || 0) > 0 ? (completados.value / props.orden.cantidad) * 100 : 0)

const avgTime = computed(() => {
  const times = props.orden.tiempos_corte || []
  if (!times.length) return 0
  return Math.round(times.reduce((s, t) => s + t, 0) / times.length)
})

const timerDisplay = computed(() => {
  if (props.orden.corte_inicio && elapsed.value > 0) return formatDuration(elapsed.value)
  if (avgTime.value > 0) return `ø ${formatDuration(avgTime.value)}`
  return '—'
})

const timerStyle = computed(() => ({
  fontVariantNumeric: 'tabular-nums',
  fontSize: '0.85rem',
  fontWeight: props.orden.corte_inicio ? '700' : '400',
  color: props.orden.corte_inicio ? 'var(--amber, #f59e0b)' : 'var(--text-muted, #888)'
}))

const materialClass = computed(() => {
  const k = (props.orden.material || '').toLowerCase()
  return k.includes('cobre') || k === 'cu' ? 'badge-cobre' : 'badge-hierro'
})

const prioridadClass = computed(() => {
  const p = (props.orden.prioridad || 'Normal').toLowerCase()
  if (p === 'alta') return 'badge-alta'
  if (p === 'baja') return 'badge-baja'
  return 'badge-normal'
})

const tipoCorto = computed(() => {
  const tipo = props.orden.tipo || ''
  if (!tipo) return '—'
  const t = tipo.toLowerCase()
  if (t === 'colector' || t === 'manguito') return tipo
  if (/^cd-|colector/i.test(tipo)) return 'Colector'
  if (/^s-|manguito|solda/i.test(tipo)) return 'Manguito'
  if (/^semi/i.test(tipo)) return 'Semielaborado'
  return tipo.length > 20 ? tipo.substring(0, 18) + '…' : tipo
})
</script>
