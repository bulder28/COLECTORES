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
        actualizado_en: serverTimestamp()
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
        batch.set(doc(db, 'stock', id), { ...item, actualizado_en: serverTimestamp() })
      })
      return batch.commit()
    }
  }
})
