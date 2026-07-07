<template>
  <div class="bar-visualizer">
    <div class="bar-header">
      <span class="bar-title">
        {{ bar.isNew ? 'Barra Nueva' : 'Retal Reutilizado' }} 
        <span class="bar-id">#{{ bar.id }}</span>
      </span>
      <span class="bar-info">
        {{ bar.material }} - {{ bar.tubSize }}" ({{ bar.originalLength }}mm)
      </span>
    </div>

    <!-- Tubo 3D estilo SolidWorks -->
    <div class="sw-scene">
      <!-- Sombra proyectada debajo del tubo -->
      <div class="tube-shadow"></div>

      <div class="sw-tube" :class="materialClass">
        <!-- Tapa izquierda del tubo (elipse) -->
        <div class="tube-cap cap-left" :class="materialClass + '-cap'"></div>

        <!-- Segmentos de corte -->
        <div 
          v-for="(cut, index) in bar.cuts" 
          :key="'c'+index"
          class="sw-segment"
          :style="{ flex: cut.length }"
          :title="`${cut.orderId}: ${cut.length}mm`"
        >
          <span class="sw-label">{{ cut.orderId }}<br>{{ cut.length }}mm</span>
          <!-- Línea de corte entre segmentos -->
          <div v-if="index < bar.cuts.length - 1 || bar.remaining > 0" class="cut-line"></div>
        </div>

        <!-- Sobrante -->
        <div 
          v-if="bar.remaining > 0"
          class="sw-segment sw-remaining"
          :class="{ 'sw-scrap': bar.newScrapGenerated }"
          :style="{ flex: bar.remaining }"
        >
          <span class="sw-label sw-label-small">
            {{ bar.newScrapGenerated ? '✅ RETAL' : '🗑️ DESECHO' }}<br>{{ bar.remaining }}mm
          </span>
        </div>

        <!-- Tapa derecha del tubo (elipse) -->
        <div class="tube-cap cap-right" :class="materialClass + '-cap'"></div>
      </div>

      <!-- Reflejo especular largo (brillo SolidWorks) -->
      <div class="specular-highlight"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  bar: {
    type: Object,
    required: true
  }
});

const materialClass = computed(() => {
  const mat = (props.bar.material || '').toLowerCase();
  if (mat.includes('cobre') || mat === 'cu') return 'sw-cobre';
  if (mat.includes('hierro') || mat === 'fe') return 'sw-hierro';
  return 'sw-default';
});
</script>

<style scoped>
.bar-visualizer {
  margin-bottom: 28px;
  background: var(--bg-surface, #1a1f2e);
  border: 1px solid var(--border-color, #2a3040);
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: var(--shadow-card, 0 4px 16px rgba(0,0,0,0.35));
}

.bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  font-weight: 700;
}

.bar-title { color: var(--text-primary, #e2e8f0); font-size: 1.1rem; }
.bar-id { color: var(--text-accent, #38bdf8); }
.bar-info { color: var(--text-secondary, #94a3b8); font-size: 0.95rem; letter-spacing: 0.05em; }

/* =========================================================
   ESCENA SOLIDWORKS
   ========================================================= */

.sw-scene {
  position: relative;
  padding: 8px 12px 20px 12px;
}

/* Sombra proyectada en el suelo (como SolidWorks) */
.tube-shadow {
  position: absolute;
  bottom: 2px;
  left: 20px;
  right: 20px;
  height: 16px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(4px);
}

/* =========================================================
   TUBO PRINCIPAL — Cilindro 3D con iluminación realista
   ========================================================= */

.sw-tube {
  display: flex;
  align-items: center;
  height: 52px;
  position: relative;
  z-index: 2;
  border-radius: 26px;
  overflow: hidden;
}

/* =========================================================
   TAPAS ELÍPTICAS (extremos del tubo)
   ========================================================= */

.tube-cap {
  position: absolute;
  width: 18px;
  height: 52px;
  z-index: 10;
  border-radius: 50%;
  flex-shrink: 0;
}

.cap-left {
  left: -6px;
  box-shadow: 2px 0 4px rgba(0,0,0,0.4);
}

.cap-right {
  right: -6px;
  box-shadow: -2px 0 4px rgba(0,0,0,0.4);
}

/* Tapas por material */
.sw-cobre-cap {
  background: radial-gradient(ellipse at 40% 35%, #ffd5b5 0%, #d4722a 40%, #6b2e0a 100%);
}
.sw-hierro-cap {
  background: radial-gradient(ellipse at 40% 35%, #e2e8f0 0%, #7a8694 40%, #1e2329 100%);
}
.sw-default-cap {
  background: radial-gradient(ellipse at 40% 35%, #bbb 0%, #666 40%, #111 100%);
}

/* =========================================================
   SEGMENTOS DEL TUBO
   ========================================================= */

.sw-segment {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 30px;
  transition: filter 0.25s;
  cursor: default;
}

.sw-segment:hover {
  filter: brightness(1.12);
}

.sw-label {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.25;
  text-shadow: 
    0 1px 3px rgba(0,0,0,0.9),
    0 0 8px rgba(0,0,0,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 6px;
  z-index: 3;
}

.sw-label-small {
  font-size: 0.62rem;
}

/* Línea de corte entre segmentos (sutil y realista) */
.cut-line {
  position: absolute;
  right: 0;
  top: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.2) 0%,
    rgba(0,0,0,0.7) 30%,
    rgba(0,0,0,0.9) 50%,
    rgba(0,0,0,0.7) 70%,
    rgba(0,0,0,0.2) 100%
  );
  z-index: 4;
  box-shadow: 1px 0 0 rgba(255,255,255,0.08);
}

/* =========================================================
   REFLEJO ESPECULAR (brillo largo tipo SolidWorks)
   ========================================================= */

.specular-highlight {
  position: absolute;
  top: 12px;
  left: 24px;
  right: 24px;
  height: 10px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255,255,255,0.06) 10%,
    rgba(255,255,255,0.22) 30%,
    rgba(255,255,255,0.35) 50%,
    rgba(255,255,255,0.22) 70%,
    rgba(255,255,255,0.06) 90%,
    transparent 100%
  );
  border-radius: 50%;
  z-index: 8;
  pointer-events: none;
}

/* =========================================================
   TEXTURAS DE MATERIAL — Estilo SolidWorks
   Cilindro con iluminación de arriba, degradado vertical
   con múltiples puntos de luz para realismo
   ========================================================= */

/* --- COBRE --- */
.sw-cobre .sw-segment {
  background: linear-gradient(
    to bottom,
    #3d1508 0%,
    #6b2e0a 5%,
    #a64a1c 12%,
    #d4722a 22%,
    #f0973f 32%,
    #ffb96e 42%,
    #ffd5b5 48%,
    #ffe8d4 50%,
    #ffd5b5 52%,
    #ffb96e 58%,
    #f0973f 68%,
    #d4722a 78%,
    #a64a1c 88%,
    #6b2e0a 95%,
    #3d1508 100%
  );
}

/* --- HIERRO / ACERO --- */
.sw-hierro .sw-segment {
  background: linear-gradient(
    to bottom,
    #12161b 0%,
    #1e2329 5%,
    #333d48 12%,
    #4f5c6a 22%,
    #6e7d8c 32%,
    #8e9dac 42%,
    #b0bec5 48%,
    #d5dee4 50%,
    #b0bec5 52%,
    #8e9dac 58%,
    #6e7d8c 68%,
    #4f5c6a 78%,
    #333d48 88%,
    #1e2329 95%,
    #12161b 100%
  );
}

/* --- DEFAULT (Acero oscuro) --- */
.sw-default .sw-segment {
  background: linear-gradient(
    to bottom,
    #0a0a0a 0%,
    #1a1a1a 5%,
    #2d2d2d 12%,
    #444 22%,
    #5e5e5e 32%,
    #787878 42%,
    #999 48%,
    #b5b5b5 50%,
    #999 52%,
    #787878 58%,
    #5e5e5e 68%,
    #444 78%,
    #2d2d2d 88%,
    #1a1a1a 95%,
    #0a0a0a 100%
  );
}

/* =========================================================
   DESPERDICIO Y RETALES
   ========================================================= */

.sw-remaining {
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 50, 50, 0.5) 0px,
    rgba(255, 50, 50, 0.5) 6px,
    rgba(100, 0, 0, 0.5) 6px,
    rgba(100, 0, 0, 0.5) 12px
  ) !important;
}

.sw-remaining.sw-scrap {
  background: repeating-linear-gradient(
    45deg,
    rgba(0, 200, 80, 0.5) 0px,
    rgba(0, 200, 80, 0.5) 6px,
    rgba(0, 110, 40, 0.5) 6px,
    rgba(0, 110, 40, 0.5) 12px
  ) !important;
  box-shadow: inset 0 0 12px rgba(0, 255, 100, 0.2);
}
</style>
