<template>
  <div class="echart-gauge-container">
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GaugeChart } from 'echarts/charts';
import VChart from 'vue-echarts';

// Registrar los componentes necesarios de ECharts
use([CanvasRenderer, GaugeChart]);

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, default: 100 },
  label: { type: String, default: '' },
  unit: { type: String, default: '%' },
  color: { type: String, default: '#C62828' } // Stulz Red por defecto
});

// Configuración profesional del Gauge en ECharts
const option = computed(() => {
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: props.max,
        splitNumber: 5,
        itemStyle: {
          color: props.color,
          shadowColor: 'rgba(0,0,0,0.4)',
          shadowBlur: 10,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        },
        progress: {
          show: true,
          roundCap: true,
          width: 14
        },
        pointer: {
          show: false // Estilo dashboard moderno (solo el anillo de progreso)
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 14,
            color: [[1, '#E0E4E8']] // Fondo claro (Stulz theme bg-surface-active)
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        title: {
          show: true,
          offsetCenter: [0, '25%'],
          fontSize: 13,
          fontWeight: 600,
          color: '#4A4A4A' // text-secondary
        },
        detail: {
          show: true,
          offsetCenter: [0, '-10%'],
          valueAnimation: true,
          formatter: function (val) {
            return Math.round(val) + props.unit;
          },
          color: '#1A1A1A', // text-primary
          fontSize: 32,
          fontWeight: 800,
          fontFamily: "'Rajdhani', sans-serif"
        },
        data: [
          {
            value: props.value,
            name: props.label
          }
        ]
      }
    ]
  };
});
</script>

<style scoped>
.echart-gauge-container {
  width: 240px;
  height: 180px;
  background: var(--bg-surface);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
