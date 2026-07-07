import { defineStore } from 'pinia';

export const useCuttingStore = defineStore('cutting', {
  state: () => ({
    // Inventario de retales (scrap) disponibles. 
    // Ejemplo de elemento: { id: 'SCRAP-1', length: 1200, material: 'Cobre', tub_size: '1/2', cell: 'A1' }
    inventory: [],
    
    // Lista de cortes a realizar (normalizados desde el Excel)
    workOrders: [],
    
    // Resultado del algoritmo: array de barras procesadas (nuevas y retales usados)
    results: [],
    
    // Constantes de configuración globales
    config: {
      barLength: 6000,      // Longitud estándar de barra nueva (mm)
      sawKerf: 5,           // Merma por el disco de corte (mm)
      minScrapLength: 500,  // Longitud mínima para guardar un retal (mm)
    }
  }),

  actions: {
    setWorkOrders(orders) {
      this.workOrders = orders;
    },
    
    setResults(results) {
      this.results = results;
    },
    
    addScrap(scrapPiece) {
      this.inventory.push({
        id: `SCRAP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...scrapPiece
      });
    },

    removeScrap(scrapId) {
      this.inventory = this.inventory.filter(s => s.id !== scrapId);
    },
    
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
  }
});
