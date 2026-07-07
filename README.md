# COLECTORES — Plataforma de Gestión de Cortes

Aplicación web para la gestión y optimización de cortes de tubos de colectores HVAC.

## Stack

- **Vue 3** + Composition API
- **Vite** — bundler y dev server
- **Pinia** — estado global reactivo
- **Vue Router** — navegación SPA
- **Firebase Firestore** — base de datos en tiempo real
- **SheetJS (xlsx)** — importación de archivos Excel

## Desarrollo local

Requisito: Node.js v22 portable en `~/tools/node-v22.16.0-win-x64`

```powershell
$nodePath = "$env:USERPROFILE\tools\node-v22.16.0-win-x64"
$env:PATH = "$nodePath;$env:PATH"
cd colector-vue
& "$nodePath\npm.cmd" run dev
```

Abre: **http://localhost:5173**

## Funcionalidades

- 📊 **Dashboard** — estadísticas en tiempo real
- 📥 **Importar** — Excel con detección automática de columnas (L_COLECTOR, L_MANGUITO, NOrden)
- 📋 **Órdenes** — filtros reactivos, timer por corte en tiempo real
- ➕ **Nueva OF** — añadir manualmente con todos los campos
- ✂️ **Optimización** — algoritmo First Fit Decreasing para minimizar desperdicio
- 📦 **Stock** — inventario de tubos
- ⚙️ **Configuración** — parámetros y estado Firebase

## Deploy

Netlify — build automático desde `main` usando `netlify.toml`:
- Base: `colector-vue/`
- Comando: `npm run build`
- Publicar: `colector-vue/dist`
