import { defineStore } from 'pinia'
import { db } from '../firebase'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, writeBatch, getDocs, query, orderBy, arrayUnion
} from 'firebase/firestore'

// Campos permitidos en actualizaciones — previene escritura de campos no autorizados
const ALLOWED_UPDATE_FIELDS = new Set([
  'completedCount', 'estado', 'corte_inicio', 'tiempos_corte',
  'prioridad', 'actualizado_en'
])

function sanitizarActualizacion(datos) {
  const sanitized = {}
  for (const [key, value] of Object.entries(datos)) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      sanitized[key] = value
    } else {
      console.warn(`[ordenes] Campo no permitido ignorado en actualizar(): '${key}'`)
    }
  }
  return sanitized
}

export const useOrdenesStore = defineStore('ordenes', {
  state: () => ({
    ordenes: [],
    loading: true,
    connected: false,
    _unsubscribe: null
  }),

  getters: {
    totalOF: (state) => state.ordenes.length,
    pendientes: (state) => state.ordenes.filter(o => (o.completedCount || 0) < (o.cantidad || 0)),
    completadas: (state) => state.ordenes.filter(o => (o.completedCount || 0) >= (o.cantidad || 0) && (o.cantidad || 0) > 0),
    uniqueEquipos: (state) => [...new Set(state.ordenes.map(o => o.numero))],
    tieneTimerActivo: (state) => state.ordenes.some(o => !!o.corte_inicio),

    metrosPendientes: (state) => {
      let cobre = 0, hierro = 0
      state.ordenes.forEach(o => {
        const pend = Math.max(0, (o.cantidad || 0) - (o.completedCount || 0))
        const metros = ((o.longitud || 0) * pend) / 1000
        if ((o.material || '').toLowerCase().includes('cobre')) cobre += metros
        else hierro += metros
      })
      return { cobre: cobre.toFixed(1), hierro: hierro.toFixed(1) }
    },

    tiempoMedioMs: (state) => {
      const all = state.ordenes.flatMap(o => o.tiempos_corte || [])
      if (!all.length) return 0
      return Math.round(all.reduce((s, t) => s + t, 0) / all.length)
    }
  },

  actions: {
    setAlgoritmo(algo) {
      this.algoritmoActual = algo
    },

    startListening() {
      if (this._unsubscribe) return
      const q = query(collection(db, 'ordenes_trabajo'), orderBy('creado_en', 'desc'))
      this._unsubscribe = onSnapshot(q, (snap) => {
        this.ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        this.loading = false
        this.connected = true
      }, (err) => {
        this.connected = false
        console.error('[Firestore] Error en onSnapshot (ordenes_trabajo):', err.code, err.message)
      })
    },

    stopListening() {
      if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null }
    },

    async agregar(orden) {
      orden.creado_en = serverTimestamp()
      orden.actualizado_en = serverTimestamp()
      return addDoc(collection(db, 'ordenes_trabajo'), orden)
    },

    async actualizar(id, datos) {
      // Sanitizar: solo permite campos de la lista blanca ALLOWED_UPDATE_FIELDS
      const datosSeguros = sanitizarActualizacion(datos)
      datosSeguros.actualizado_en = serverTimestamp()
      return updateDoc(doc(db, 'ordenes_trabajo', id), datosSeguros)
    },

    async eliminar(id) {
      return deleteDoc(doc(db, 'ordenes_trabajo', id))
    },

    async importar(ordenes) {
      const BATCH = 450
      const promises = []
      for (let i = 0; i < ordenes.length; i += BATCH) {
        const chunk = ordenes.slice(i, i + BATCH)
        const batch = writeBatch(db)
        chunk.forEach(o => {
          const ref = doc(collection(db, 'ordenes_trabajo'))
          batch.set(ref, { ...o, creado_en: serverTimestamp(), actualizado_en: serverTimestamp() })
        })
        promises.push(batch.commit())
      }
      return Promise.all(promises)
    },

    async eliminarTodas() {
      const confirmacion = window.prompt('Peligro: Se van a borrar TODAS las órdenes de trabajo.\nEscribe "BORRAR" para confirmar:');
      if (confirmacion !== 'BORRAR') {
        return Promise.reject(new Error('Borrado masivo cancelado.'));
      }
      
      const snap = await getDocs(collection(db, 'ordenes_trabajo'))
      if (snap.empty) return 0
      const BATCH = 450
      const docs = snap.docs
      const promises = []
      for (let i = 0; i < docs.length; i += BATCH) {
        const batch = writeBatch(db)
        docs.slice(i, i + BATCH).forEach(d => batch.delete(d.ref))
        promises.push(batch.commit())
      }
      await Promise.all(promises)
      return docs.length
    },

    async incrementarCompletados(id) {
      const of = this.ordenes.find(o => o.id === id)
      if (!of) return
      const current = of.completedCount || 0
      if (current >= (of.cantidad || 0)) return
      const updates = { completedCount: current + 1 }
      if (of.corte_inicio) {
        updates.tiempos_corte = arrayUnion(Date.now() - of.corte_inicio)
        updates.corte_inicio = null
      }
      updates.estado = (current + 1 >= (of.cantidad || 0)) ? 'completado' : 'en_progreso'
      return this.actualizar(id, updates)
    },

    async decrementarCompletados(id) {
      const of = this.ordenes.find(o => o.id === id)
      if (!of || (of.completedCount || 0) <= 0) return
      const current = of.completedCount || 0
      const updates = {
        completedCount: current - 1,
        estado: current - 1 > 0 ? 'en_progreso' : 'pendiente',
        tiempos_corte: (of.tiempos_corte || []).slice(0, -1)
      }
      return this.actualizar(id, updates)
    },

    async toggleTimer(id) {
      const of = this.ordenes.find(o => o.id === id)
      if (!of) return
      if (of.corte_inicio) {
        return this.actualizar(id, { corte_inicio: null })
      } else {
        return this.actualizar(id, { corte_inicio: Date.now(), estado: 'en_progreso' })
      }
    }
  }
})
