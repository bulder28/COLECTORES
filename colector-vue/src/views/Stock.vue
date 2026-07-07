<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Stock de Tubos</h1>
        <p class="section-subtitle">Gestiona el inventario de tubos disponibles</p>
      </div>
    </div>

    <div class="card mb-6" style="max-width:600px;">
      <h3 class="card-title mb-4">Añadir Stock</h3>
      <form @submit.prevent="agregar">
        <div class="form-inline">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Medida</label>
            <select class="form-select" v-model="form.medida">
              <option value="1/2">1/2"</option><option value="3/8">3/8"</option>
              <option value="5/8">5/8"</option><option value="2">2"</option>
              <option value="1 5/8">1 5/8"</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Material</label>
            <select class="form-select" v-model="form.material">
              <option value="Cobre">Cobre</option>
              <option value="Hierro">Hierro</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Cantidad</label>
            <input type="number" class="form-input" v-model.number="form.cantidad" min="0" style="width:100px;">
          </div>
          <button type="submit" class="btn btn-primary btn-sm" style="align-self:flex-end;">Añadir</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Medida</th><th>Material</th><th>Cantidad</th><th>Acción</th></tr></thead>
          <tbody>
            <tr v-if="stock.loading"><td colspan="4"><div class="table-empty"><div class="table-empty-text">Cargando...</div></div></td></tr>
            <tr v-else-if="stock.items.length === 0"><td colspan="4"><div class="table-empty"><div class="table-empty-text">No hay stock configurado</div></div></td></tr>
            <tr v-for="item in stock.items" :key="item.id">
              <td>{{ item.medida }}"</td>
              <td><span class="badge" :class="item.material === 'Cobre' ? 'badge-cobre' : 'badge-hierro'">{{ item.material }}</span></td>
              <td>
                <input type="number" class="form-input stock-input" :value="item.cantidad"
                  @change="stock.actualizar(item.id, $event.target.value)" min="0">
              </td>
              <td>
                <button class="btn btn-ghost btn-icon btn-xs" @click="stock.eliminar(item.id)" style="color:var(--red)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStockStore } from '../stores/stock'

const stock = useStockStore()
const form = ref({ medida: '1/2', material: 'Cobre', cantidad: 10 })

async function agregar() {
  await stock.agregar(form.value.medida, form.value.material, form.value.cantidad)
}
</script>
