<template>
  <div class="airport-board-container">
    <div class="board-header">
      <h1 class="board-title">PLANIFICADOR DE CORTES (AEROPUERTO)</h1>
      <div class="board-clock">{{ currentTime }}</div>
    </div>

    <!-- The Split-Flap Board -->
    <div class="flap-board">
      <div class="flap-row header-row">
        <div class="flap-cell w-num">LOTE</div>
        <div class="flap-cell w-mat">MATERIAL</div>
        <div class="flap-cell w-med">MEDIDA</div>
        <div class="flap-cell w-padre">BATERÍA (PADRE)</div>
        <div class="flap-cell w-len">LONG. ORIG</div>
        <div class="flap-cell w-cuts">Nº CORTES</div>
        <div class="flap-cell w-waste">RETAL</div>
      </div>

      <div 
        v-for="(tubo, idx) in currentBatch" 
        :key="tubo.id" 
        class="flap-row data-row"
        :style="{ animationDelay: `${idx * 0.1}s` }"
      >
        <div class="flap-cell w-num">{{ idx + 1 }}</div>
        <div class="flap-cell w-mat" :class="tubo.material === 'Cobre' ? 'text-copper' : 'text-iron'">
          {{ tubo.material.padEnd(8, ' ') }}
        </div>
        <div class="flap-cell w-med">{{ tubo.tubSize.padEnd(6, ' ') }}"</div>
        <div class="flap-cell w-padre text-accent" title="Batería principal de este tubo">{{ tubo.cuts[0]?.norden_padre || 'Sin Batería' }}</div>
        <div class="flap-cell w-len">{{ tubo.originalLength }}MM</div>
        <div class="flap-cell w-cuts">{{ tubo.cuts.length }} CORTES</div>
        <div class="flap-cell w-waste" :class="{ 'text-green': tubo.newScrapGenerated, 'text-red': !tubo.newScrapGenerated && tubo.remaining > 0 }">
          {{ tubo.remaining }}MM
        </div>
      </div>

      <div v-if="currentBatch.length === 0" class="flap-row empty-row">
        <div class="flap-cell full-width">NO HAY CORTES PENDIENTES</div>
      </div>
    </div>

    <!-- Acciones del Operario -->
    <div class="board-footer">
      <div class="batch-info">
        MOSTRANDO TUBOS {{ startIndex + 1 }} - {{ Math.min(startIndex + batchSize, allTubos.length) }} DE {{ allTubos.length }}
      </div>
      <button 
        class="btn-complete-batch" 
        @click="completarLote"
        :disabled="currentBatch.length === 0 || isProcessing"
      >
        {{ isProcessing ? 'PROCESANDO...' : 'LOTE COMPLETADO ► SIGUIENTES 10' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useOrdenesStore } from '../stores/ordenes';
import { useStockStore } from '../stores/stock';

const store = useOrdenesStore();
const stockStore = useStockStore();
const currentTime = ref('');
let timer = null;

// Parámetros de optimización
const stockLength = 6000;
const mermaTubo = 3;

// Estado del paginador
const batchSize = 10;
const startIndex = ref(0);

// Actualizar reloj
onMounted(() => {
  timer = setInterval(() => {
    const now = new Date();
    currentTime.value = now.toTimeString().split(' ')[0];
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});

// Función para obtener todos los tubos optimizados y ordenados por urgencia
const allTubos = computed(() => {
  if (!store.ordenes.length) return [];
  
  const ordenes = store.ordenes;
  const grupos = {};
  
  // Agrupar órdenes
  ordenes.forEach(of => {
    const pend = Math.max(0, (of.cantidad || 0) - (of.completedCount || 0));
    if (pend <= 0) return;
    const key = `${of.medida}-${(of.material || 'Cobre')}`;
    if (!grupos[key]) grupos[key] = { medida: of.medida, material: of.material, cortes: [] };
    for (let i = 0; i < pend; i++) {
      grupos[key].cortes.push({ 
        of: of.numero, 
        norden_padre: of.norden_padre || 'Sin Batería',
        longitud: of.longitud || 0, 
        tipo: of.tipo || 'colector', 
        ofObj: of
      });
    }
  });

  let flattenedTubos = [];
  let tuboGlobalId = 1;

  for (const grupo of Object.values(grupos)) {
    // Para respetar el orden del Excel, agrupamos por Batería manteniendo el orden de aparición original
    const cortesByPadre = new Map();
    grupo.cortes.forEach(c => {
      if (!cortesByPadre.has(c.norden_padre)) cortesByPadre.set(c.norden_padre, []);
      cortesByPadre.get(c.norden_padre).push(c);
    });

    const tubos = [];
    
    // Procesamos cada Batería en el orden que venía en el Excel
    for (const [padre, cortes] of cortesByPadre) {
      // Ordenar por longitud descendente dentro de la misma batería (FFD)
      cortes.sort((a, b) => b.longitud - a.longitud);
      
      cortes.forEach(corte => {
        let placed = false;
        // First Fit: Primer hueco libre
        for (const tubo of tubos) {
          if (stockLength - tubo.usado - mermaTubo >= corte.longitud) {
            tubo.cortes.push(corte); 
            tubo.usado += corte.longitud + mermaTubo; 
            placed = true; 
            break;
          }
        }
        if (!placed) tubos.push({ cortes: [corte], usado: corte.longitud + mermaTubo });
      });
    }

    tubos.forEach(t => { 
      t.desperdicio = stockLength - t.usado;
      
      t.id = `TB-${tuboGlobalId++}`;
      t.isNew = true;
      t.material = grupo.material;
      t.tubSize = grupo.medida;
      t.originalLength = stockLength;
      t.remaining = t.desperdicio;
      t.newScrapGenerated = t.remaining >= 500;
      t.cuts = t.cortes;
      
      flattenedTubos.push(t);
    });
  }

  // Ordenar todos los tubos generados por su prioridad máxima (para que los urgentes salgan primero)
  flattenedTubos.sort((a, b) => b.maxPriority - a.maxPriority);

  return flattenedTubos;
});

// Lote actual a mostrar
const currentBatch = computed(() => {
  return allTubos.value.slice(startIndex.value, startIndex.value + batchSize);
});

const isProcessing = ref(false);

// Completar lote y avanzar
async function completarLote() {
  if (isProcessing.value) return;
  isProcessing.value = true;
  
  try {
    const batch = currentBatch.value;
    
    for (const tubo of batch) {
      // 1. Si sobra material útil, lo guardamos como retal en el stock
      if (tubo.newScrapGenerated && tubo.remaining > 0) {
        await stockStore.agregarRetal(tubo.tubSize, tubo.material, tubo.remaining);
      }
      
      // 2. Marcar los cortes como completados en las Órdenes de Trabajo
      for (const cut of tubo.cuts) {
        if (cut.ofObj && cut.ofObj.id) {
          await store.incrementarCompletados(cut.ofObj.id);
        }
      }
    }
    
    // Como las órdenes completadas desaparecen de allTubos reactivamente,
    // NO necesitamos sumar +10 al startIndex, ya que el siguiente lote
    // pasará automáticamente a ocupar los índices 0 al 9.
    
    if (allTubos.value.length === 0) {
      alert("¡Todos los cortes han sido completados!");
    }
  } catch (error) {
    console.error("Error al completar lote:", error);
    alert("Hubo un error al procesar el lote.");
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style scoped>
.airport-board-container {
  background: #0a0a0c;
  min-height: calc(100vh - 120px);
  padding: 30px;
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  color: #fff;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 4px solid #333;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.board-title {
  color: #fdb813;
  font-size: 2rem;
  letter-spacing: 4px;
  margin: 0;
  text-shadow: 0 0 15px rgba(253, 184, 19, 0.4);
}

.board-clock {
  font-size: 2.5rem;
  color: #fdb813;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(253, 184, 19, 0.4);
}

/* Tablero Flap */
.flap-board {
  background: #111;
  padding: 10px;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
}

.flap-row {
  display: flex;
  margin-bottom: 6px;
}

.header-row .flap-cell {
  background: #222;
  color: #888;
  font-size: 0.9rem;
  border-color: #333;
  box-shadow: none;
}

.flap-cell {
  background: #1a1a1a;
  border: 1px solid #000;
  border-top: 1px solid #333;
  border-left: 1px solid #2a2a2a;
  padding: 12px 15px;
  font-size: 1.4rem;
  font-weight: 700;
  color: #e0e0e0;
  margin-right: 4px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

/* Efecto visual de la bisagra del split-flap */
.flap-cell::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(0,0,0,0.6);
  z-index: 2;
  box-shadow: 0 1px 0 rgba(255,255,255,0.05);
}

/* Anchos de columnas */
.w-num { width: 80px; text-align: center; justify-content: center; color: #fdb813; }
.w-mat { width: 140px; }
.w-med { width: 120px; }
.w-padre { width: 220px; color: #38bdf8; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.w-len { width: 160px; text-align: right; justify-content: flex-end; }
.w-cuts { width: 160px; text-align: right; justify-content: flex-end; }
.w-waste { flex: 1; text-align: right; justify-content: flex-end; }
.full-width { flex: 1; justify-content: center; color: #fdb813; }

/* Colores específicos */
.text-copper { color: #ff8f4a; }
.text-iron { color: #9ba6b5; }
.text-green { color: #00ffaa; text-shadow: 0 0 10px rgba(0, 255, 170, 0.4); }
.text-red { color: #ff3333; }

/* Animación de entrada (simula cambio de paneles) */
.data-row {
  animation: flipIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
  transform-origin: center center;
}

@keyframes flipIn {
  0% { transform: rotateX(90deg); opacity: 0; }
  100% { transform: rotateX(0deg); opacity: 1; }
}

/* Footer */
.board-footer {
  margin-top: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-info {
  font-size: 1.2rem;
  color: #888;
}

.btn-complete-batch {
  background: #fdb813;
  color: #000;
  border: none;
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: 800;
  font-family: 'Courier New', Courier, monospace;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 4px 15px rgba(253, 184, 19, 0.3);
  transition: all 0.2s;
}

.btn-complete-batch:hover {
  background: #ffcc44;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(253, 184, 19, 0.4);
}

.btn-complete-batch:active {
  transform: translateY(1px);
}

.btn-complete-batch:disabled {
  background: #444;
  color: #222;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}
</style>
