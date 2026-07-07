# Colectores App — Gestión de Corte de Tubo

App web completa para gestión y optimización de corte de tubo (colectores y manguitos).
Fusiona lo mejor de los dos prototipos HTML:

- **De colector_project.html**: importación con mapeo de columnas, prioridades, stats,
  seguimiento de cortes completados, tiempos medios.
- **De COLONEW1.2**: celdas homogéneas de trabajo (Estrategia 3), agrupación por bloques
  (material + medida de tubo), mapa de aprovechamiento de barra (nesting 1D).

## Arquitectura

```
colectores-app/
├── backend/                  # API REST (FastAPI + SQLAlchemy + SQLite/PostgreSQL)
│   └── app/
│       ├── main.py           # Punto de entrada, registro de routers
│       ├── core/             # Configuración y conexión a BD
│       ├── models/           # Tablas: OT, Registro, PlanNesting, Barra
│       ├── api/              # Endpoints: /ots /import /nesting /stats
│       └── services/         # Lógica de negocio: importador Excel/CSV, nesting 1D
├── frontend/                 # SPA (React + Vite)
│   └── src/
│       ├── pages/            # Dashboard, Importar, Órdenes, Nesting
│       ├── components/       # Tarjetas de celda, tabla de registros, mapa de barra
│       └── services/api.js   # Cliente HTTP hacia el backend
└── docs/                     # Decisiones de diseño y roadmap
```

## Flujo principal

1. **Importar** reporte de OT (.xlsx/.csv) → mapeo de columnas → registros en BD.
2. **Agrupar** en celdas homogéneas por material + medida de tubo.
3. **Optimizar**: nesting 1D (First Fit Decreasing) contra la barra de stock configurada.
4. **Ejecutar**: marcar cortes completados, ver progreso y tiempos medios.

## Arrancar en desarrollo

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload        # http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

## Esquema de datos de origen (Excel)

`OT | MEDIDA_TUBO | MATERIAL | L_COLECTOR | L_MANGUITO`
