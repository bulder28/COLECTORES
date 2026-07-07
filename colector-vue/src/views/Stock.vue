<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Stock de Tubos</h1>
        <p class="section-subtitle">Gestiona el inventario de tubos disponibles</p>
      </div>
    </div>

    <div class="card mt-6" style="min-height: 70vh;">
      <h3 class="card-title mb-4">Estantería de Retales Físicos (Cantilever)</h3>
      
      <div v-if="stock.loading" class="table-empty"><div class="table-empty-text">Cargando...</div></div>
      <div v-else-if="stock.retales.length === 0" class="rack-empty">
        <p style="color:#9ca3af; margin-bottom:12px;">Estantería vacía — Aún no se han generado retales</p>
        <button class="btn btn-sm" style="background:#374151; color:#d1d5db;" @click="cargarRetalesDemo">Cargar retales de demostración</button>
      </div>
      
      <div v-else class="cantilever-rack">
        
        <!-- Niveles (Estantes) -->
        <div class="shelf" v-for="(shelfGroup, index) in groupedRetales" :key="index">
          <div class="tubes-container">
            <div v-for="item in shelfGroup" :key="item.id" 
                 class="sw-tube" 
                 :class="item.material === 'Cobre' ? 'sw-copper' : 'sw-iron'"
                 :style="{ width: Math.max(10, (item.longitud / 6000 * 100)) + '%' }"
                 :title="`${item.material} ${item.medida}\&#34; - ${item.longitud}mm`">
                 
              <div class="sw-specular"></div>
              <span class="sw-label">{{ item.longitud }}mm</span>
              
              <!-- Botón eliminar -->
              <button class="delete-tube-btn" @click.stop="stock.eliminar(item.id)" title="Consumir / Tirar">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStockStore } from '../stores/stock'

const stock = useStockStore()

async function cargarRetalesDemo() {
  const demos = [
    { medida: '1/2', material: 'Cobre', longitud: 3200 },
    { medida: '1/2', material: 'Cobre', longitud: 1540 },
    { medida: '3/8', material: 'Hierro', longitud: 2800 },
    { medida: '3/8', material: 'Hierro', longitud: 900 },
    { medida: '1/2', material: 'Cobre', longitud: 4100 },
    { medida: '5/8', material: 'Hierro', longitud: 600 },
    { medida: '3/8', material: 'Cobre', longitud: 2100 },
  ];
  for (const r of demos) {
    await stock.agregarRetal(r.medida, r.material, r.longitud);
  }
}

const groupedRetales = computed(() => {
  // Agrupamos en lotes de 4 o 5 tubos para hacer múltiples estantes
  const chunks = [];
  const items = stock.retales;
  for (let i = 0; i < items.length; i += 5) {
    chunks.push(items.slice(i, i + 5));
  }
  return chunks;
});
</script>

<style scoped>
.cantilever-rack {
  position: relative;
  background-image: url('/rack_real.png');
  background-size: contain;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-color: #f8fafc; /* Color claro para la imagen real */
  border-radius: 8px;
  padding: 60px 20px 20px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 60px;
  overflow: hidden;
  border: 2px solid #1a202c;
  box-shadow: inset 0 10px 40px rgba(0,0,0,0.8);
}

/* Estantes (Brazos) */
.shelf {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

/* Contenedor de tubos apoyados */
.tubes-container {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  padding: 0 10px;
  position: relative;
  z-index: 4;
}

/* Estilo del tubo (Render SolidWorks) */
.sw-tube {
  height: 36px;
  border-radius: 18px; /* Cilindro visto lateralmente, bordes redondeados */
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 10px rgba(0,0,0,0.6);
  min-width: 60px; /* Para que el texto quepa */
}

.sw-tube:hover {
  transform: translateY(-8px);
  filter: brightness(1.2);
  z-index: 10;
}

.sw-copper {
  background: linear-gradient(180deg, 
    #5a2b18 0%, 
    #a85232 15%, 
    #e8825d 30%, 
    #ffb499 45%, 
    #e8825d 60%, 
    #a85232 85%, 
    #4a2111 100%
  );
}

.sw-iron {
  background: linear-gradient(180deg, 
    #2c3035 0%, 
    #58606a 15%, 
    #9aa5b1 30%, 
    #d1d8e0 45%, 
    #9aa5b1 60%, 
    #58606a 85%, 
    #1f2226 100%
  );
}

.sw-specular {
  position: absolute;
  top: 30%;
  left: 0;
  right: 0;
  height: 15%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
  opacity: 0.7;
  pointer-events: none;
}

.sw-label {
  color: #fff;
  font-size: 0.8rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  pointer-events: none;
  z-index: 5;
}

/* Botón eliminar estilo chatarra */
.delete-tube-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  background: #ef4444;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.5);
  z-index: 10;
}

.sw-tube:hover .delete-tube-btn {
  opacity: 1;
}

.delete-tube-btn:hover {
  background: #dc2626;
  transform: scale(1.15);
}

.rack-empty {
  background: #111827;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  border: 1px dashed #374151;
}
</style>
