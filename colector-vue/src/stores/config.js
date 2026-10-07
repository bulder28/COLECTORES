import { defineStore } from 'pinia'

const STORAGE_KEY = 'colector_config_v2'

const DEFAULT_CONFIG = {
  // Configuración de Tubos y Colectores
  tubos: {
    longitud_barra: 6000,
    merma_corte: 3.0,
    retal_minimo: 500,
    medidas: ['1/2', '3/8', '5/8', '2', '1 5/8', '7/8', '1 1/8', '1 3/8'],
    materiales: ['Cobre', 'Hierro', 'Aluminio'],
    tipos: ['colector', 'manguito', 'tubo']
  },
  // Configuración de Perfiles Estructurales
  perfiles: {
    longitud_barra: 6000,
    merma_corte: 3.5,
    retal_minimo: 500,
    secciones: ['55x55', '40x40', '30x30', '20x20', '45x45', '60x40', '80x40', '50x30', '50x50'],
    materiales: ['Aluminio', 'Hierro / Acero'],
    tipos: ['perfil ranurado', 'tubo cuadrado', 'tubo rectangular', 'ángulo L', 'perfil U', 'pletina']
  },
  // Configuración del Sistema y Motores
  sistema: {
    algoritmo_predeterminado: 'bfd'
  }
}

export const useConfigStore = defineStore('config', {
  state: () => {
    let saved = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('colector_config')
      if (raw) saved = JSON.parse(raw)
    } catch (e) {
      console.warn('Error reading stored config:', e)
    }

    return {
      tubos: saved?.tubos || {
        ...DEFAULT_CONFIG.tubos,
        longitud_barra: saved?.longitud_tubo_estandar || DEFAULT_CONFIG.tubos.longitud_barra,
        merma_corte: saved?.merma_tubo || DEFAULT_CONFIG.tubos.merma_corte,
      },
      perfiles: saved?.perfiles || {
        ...DEFAULT_CONFIG.perfiles
      },
      sistema: saved?.sistema || {
        ...DEFAULT_CONFIG.sistema
      }
    }
  },

  getters: {
    // Obtener parámetros según el tipo de elemento
    getConfigParaTipo: (state) => (tipo) => {
      const isPerfil = tipo && (/perfil|cuadrado|rectangular|ángulo|angulo|pletina|x/i.test(tipo))
      return isPerfil ? state.perfiles : state.tubos
    }
  },

  actions: {
    guardarConfig(nuevaConfig) {
      if (nuevaConfig.tubos) this.tubos = { ...this.tubos, ...nuevaConfig.tubos }
      if (nuevaConfig.perfiles) this.perfiles = { ...this.perfiles, ...nuevaConfig.perfiles }
      if (nuevaConfig.sistema) this.sistema = { ...this.sistema, ...nuevaConfig.sistema }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          tubos: this.tubos,
          perfiles: this.perfiles,
          sistema: this.sistema
        }))
      } catch (e) {
        console.error('Error saving config:', e)
      }
    },

    resetDefaults() {
      this.tubos = { ...DEFAULT_CONFIG.tubos }
      this.perfiles = { ...DEFAULT_CONFIG.perfiles }
      this.sistema = { ...DEFAULT_CONFIG.sistema }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG))
      } catch (e) {}
    }
  }
})
