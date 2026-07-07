import { defineStore } from 'pinia'
import { db } from '../firebase'
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, setDoc, getDocs, writeBatch
} from 'firebase/firestore'

export const useStockStore = defineStore('stock', {
  state: () => ({
    items: [],
    loading: true,
    _unsubscribe: null
  }),

  getters: {
    tubosCompletos: (state) => state.items.filter(i => i.tipo !== 'retal'),
    retales: (state) => state.items.filter(i => i.tipo === 'retal')
  },

  actions: {
    startListening() {
      if (this._unsubscribe) return
      this._unsubscribe = onSnapshot(collection(db, 'stock'), (snap) => {
        this.items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        this.loading = false
      })
    },

    stopListening() {
      if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null }
    },

    async actualizar(id, cantidad) {
      return setDoc(doc(db, 'stock', id),
        { cantidad: parseInt(cantidad, 10), actualizado_en: serverTimestamp() },
        { merge: true }
      )
    },

    async agregar(medida, material, cantidad) {
      const id = `${medida.replace(/\//g, '_')}-${material}`
      return setDoc(doc(db, 'stock', id), {
        medida, material,
        cantidad: parseInt(cantidad, 10),
        tipo: 'tubo',
        actualizado_en: serverTimestamp()
      })
    },

    async agregarRetal(medida, material, longitud) {
      return addDoc(collection(db, 'stock'), {
        medida, material,
        longitud: parseInt(longitud, 10),
        cantidad: 1, // Un retal es una pieza individual
        tipo: 'retal',
        creado_en: serverTimestamp()
      })
    },

    async eliminar(id) {
      return deleteDoc(doc(db, 'stock', id))
    },

    async inicializar() {
      const snap = await getDocs(collection(db, 'stock'))
      if (!snap.empty) return
      const defaults = [
        { medida: '1/2', material: 'Cobre', cantidad: 10 },
        { medida: '1/2', material: 'Hierro', cantidad: 10 },
        { medida: '3/8', material: 'Cobre', cantidad: 10 },
        { medida: '3/8', material: 'Hierro', cantidad: 10 },
        { medida: '5/8', material: 'Cobre', cantidad: 10 },
        { medida: '5/8', material: 'Hierro', cantidad: 10 },
      ]
      const batch = writeBatch(db)
      defaults.forEach(item => {
        const id = `${item.medida.replace(/\//g, '_')}-${item.material}`
        batch.set(doc(db, 'stock', id), { ...item, tipo: 'tubo', actualizado_en: serverTimestamp() })
      })
      
      // Retales de demostración para llenar la estantería
      const retalesDemo = [
        { medida: '1/2', material: 'Cobre', longitud: 3200 },
        { medida: '1/2', material: 'Cobre', longitud: 1540 },
        { medida: '3/8', material: 'Hierro', longitud: 2800 },
        { medida: '3/8', material: 'Hierro', longitud: 900 },
        { medida: '1/2', material: 'Cobre', longitud: 4100 },
        { medida: '5/8', material: 'Hierro', longitud: 600 },
        { medida: '3/8', material: 'Cobre', longitud: 2100 },
      ]
      retalesDemo.forEach((r, i) => {
        const rid = `retal-demo-${i}`
        batch.set(doc(db, 'stock', rid), { ...r, cantidad: 1, tipo: 'retal', creado_en: serverTimestamp() })
      })
      
      return batch.commit()
    }
  }
})
