import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Ordenes from '../views/Ordenes.vue'
import Import from '../views/Import.vue'
import NuevaOf from '../views/NuevaOf.vue'
import Optimizacion from '../views/Optimizacion.vue'
import Stock from '../views/Stock.vue'
import Config from '../views/Config.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/ordenes', name: 'ordenes', component: Ordenes },
  { path: '/import', name: 'import', component: Import },
  { path: '/nueva-of', name: 'nueva-of', component: NuevaOf },
  { path: '/optimizacion', name: 'optimizacion', component: Optimizacion },
  { path: '/stock', name: 'stock', component: Stock },
  { path: '/config', name: 'config', component: Config },
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
