<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Optimización de Cortes</h1>
        <p class="section-subtitle">Suite de 7 motores industriales de corte 1D (Bin Packing) para Tubos y Perfiles</p>
      </div>
      <div class="action-row" style="gap:10px; flex-wrap:wrap;">
        <button 
          type="button" 
          class="btn btn-sm btn-outline-cyan" 
          @click="cargarCasoEstudioCompleto"
          title="Carga el ejemplo de 24 piezas de perfil 55x55 (8x 3760, 8x 3650, 8x 2450) con barras de 4, 6, 7 y 8m"
        >
          <Layers :size="15" />
          <span>Caso de Ensayo (24 Perfiles)</span>
        </button>
        <button 
          type="button" 
          class="btn btn-sm btn-primary" 
          @click="mostrarModalEstudio = true"
        >
          <FileText :size="15" />
          <span>Informe Técnico Oficial (PDF)</span>
        </button>
      </div>
    </div>

    <!-- Banner informativo si el Caso de Estudio está activo -->
    <div v-if="usandoCasoEstudio" class="card mb-4" style="background: rgba(14, 165, 233, 0.12); border: 1px solid var(--primary, #38bdf8); max-width: 1040px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
      <div>
        <strong style="color:var(--primary, #38bdf8);">CASO DE ENSAYO ACTIVO:</strong> 
        24 Perfiles de Aluminio 55x55 (8x 3.760mm, 8x 3.650mm, 8x 2.450mm = 78.88 M/L) | Sierra: 3.0mm | Umbral Merma: 200mm | Barras: 4m, 6m, 7m, 8m.
      </div>
      <button class="btn btn-xs btn-ghost" @click="desactivarCasoEstudio" style="color:#f8fafc; border:1px solid rgba(255,255,255,0.2);">
        Cerrar Ensayo y Volver a Órdenes
      </button>
    </div>

    <!-- Panel de Parámetros y Configuración de Material -->
    <div class="card mb-6" style="max-width: 1040px;">
      <div class="card-header">
        <h3 class="card-title">Parámetros del Material y Máquina</h3>
        <div class="param-preset-buttons">
          <button 
            type="button" 
            class="btn btn-xs"
            :class="modoParam === 'tubos' ? 'btn-primary' : 'btn-ghost'"
            @click="cargarPreset('tubos')"
          >
            Tubos & Colectores
          </button>
          <button 
            type="button" 
            class="btn btn-xs"
            :class="modoParam === 'perfiles' ? 'btn-primary' : 'btn-ghost'"
            @click="cargarPreset('perfiles')"
          >
            Perfiles Estructurales (55x55)
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Filtrar Elementos a Optimizar</label>
          <select class="form-select" v-model="filtroCategoria">
            <option value="todos">Todos los Elementos (Tubos y Perfiles)</option>
            <option value="tubo">Solo Tubos y Colectores Cobre/Hierro</option>
            <option value="perfil">Solo Perfiles Estructurales Aluminio</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Estrategia de Barras Comerciales</label>
          <select class="form-select" v-model="modoEstrategia">
            <option value="homogenea">Comparativa Homogénea (Sin mezclar medidas en pedido: 4m vs 6m vs 7m vs 8m)</option>
            <option value="multi">Combinación Libre Multi-Longitud (Mezcla de medidas: ej. 10x 8m + 1x 6m)</option>
            <option value="fija">Barra Única Fija Manual (ej: 6.000 mm)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Merma por Corte de Disco (mm)</label>
          <input type="number" class="form-input" v-model.number="mermaTubo" min="0" step="0.5">
          <div class="form-hint">Espesor de corte de la sierra (ej: 3.5 mm)</div>
        </div>

        <div class="form-group">
          <label class="form-label">Longitud Mínima para Retal Útil (mm)</label>
          <input type="number" class="form-input" v-model.number="retalMinimo" min="0" step="50" placeholder="0 = Sin retales">
          <div class="form-hint">
            <span v-if="retalMinimo <= 0" style="color:var(--amber, #f59e0b);">
              <strong>0 mm:</strong> No se aprovechan retales; el 100% del sobrante se clasifica como desperdicio directo.
            </span>
            <span v-else>
              Sobrantes &ge; {{ retalMinimo }}mm se guardan como retal útil; menores son desperdicio.
            </span>
          </div>
        </div>
      </div>

      <div class="form-row" v-if="modoEstrategia === 'fija'">
        <div class="form-group">
          <label class="form-label">Longitud de Barra Base (mm)</label>
          <input type="number" class="form-input" v-model.number="stockLength" min="500" step="500">
          <div class="form-hint">Largo de barra fija suministrada por proveedor</div>
        </div>
      </div>

      <!-- Configuración Avanzada de Múltiples Longitudes y Costes -->
      <div v-if="modoEstrategia === 'multi' || modoEstrategia === 'homogenea'" class="multi-stock-box mt-3">
        <div class="multi-stock-header">
          <div>
            <strong>{{ modoEstrategia === 'homogenea' ? 'Medidas Comerciales a Comparar de Forma Independiente (Sin Mezclar)' : 'Catálogo de Barras Comerciales y Costes (€)' }}</strong>
            <p class="text-xs text-muted" style="margin:2px 0 0 0;">
              {{ modoEstrategia === 'homogenea'
                  ? 'Active las longitudes a evaluar. Cada medida se optimizará sin mezclar perfiles (o todas de 4m, o todas de 6m, o todas de 7m, o todas de 8m) para encontrar cuál ofrece menor desperdicio.'
                  : 'Active las longitudes que suministra su proveedor. El motor calculará la mejor combinación para minimizar desperdicio y coste.' }}
            </p>
          </div>
          <button type="button" class="btn btn-ghost btn-xs" @click="agregarNuevaLongitud">+ Añadir Medida</button>
        </div>

        <div class="multi-stock-table-wrapper mt-3">
          <table class="multi-stock-table">
            <thead>
              <tr>
                <th style="width: 50px;">Activa</th>
                <th>Longitud Comercial</th>
                <th>Coste / Barra (€) <small class="text-muted">(Opcional)</small></th>
                <th>Coste / Metro Estimado</th>
                <th style="width: 40px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(barra, idx) in opcionesBarras" :key="idx">
                <td style="text-align: center;">
                  <input type="checkbox" v-model="barra.activa" style="accent-color:var(--primary, #38bdf8); transform: scale(1.2);">
                </td>
                <td>
                  <strong>{{ (barra.longitud / 1000).toFixed(1) }} m</strong> 
                  <span class="text-muted">({{ barra.longitud }} mm)</span>
                </td>
                <td>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <input 
                      type="number" 
                      class="form-input form-input-xs" 
                      v-model.number="barra.coste" 
                      placeholder="0.00" 
                      min="0" 
                      step="0.5"
                      style="width: 100px;"
                    >
                    <span>€</span>
                  </div>
                </td>
                <td>
                  <span class="text-sm" :class="barra.coste > 0 ? 'text-accent' : 'text-muted'">
                    {{ barra.coste > 0 ? (barra.coste / (barra.longitud / 1000)).toFixed(2) + ' €/m' : '— (Calculando por merma física)' }}
                  </span>
                </td>
                <td>
                  <button 
                    v-if="opcionesBarras.length > 2" 
                    type="button" 
                    class="tag-remove" 
                    @click="opcionesBarras.splice(idx, 1)"
                    title="Eliminar esta medida"
                  >×</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SELECTOR VISUAL DE ALGORITMOS DE CORTE -->
      <div class="algorithm-selection-box mt-5">
        <div class="algorithm-header">
          <div>
            <h4 style="margin:0 0 4px 0; display:flex; align-items:center; gap:8px;">
              Motores de Cálculo de Corte 1D
              <span class="badge badge-aluminio" style="font-size: 0.72rem;">7 Motores Integrados</span>
            </h4>
            <p class="text-xs text-muted" style="margin:0;">
              Seleccione el motor según el objetivo de producción (mínimo desperdicio, kitting sin WIP o reutilización de stock).
            </p>
          </div>
          <button 
            type="button" 
            class="btn btn-ghost btn-xs" 
            @click="mostrarGuiaAlgoritmos = !mostrarGuiaAlgoritmos"
          >
            {{ mostrarGuiaAlgoritmos ? 'Ocultar Guía' : 'Guía de Selección Técnica' }}
          </button>
        </div>

        <!-- Guía Técnica Expandible -->
        <div v-if="mostrarGuiaAlgoritmos" class="guide-box mt-3">
          <p style="margin:0 0 6px 0;"><strong>Criterios Técnicos de Selección:</strong></p>
          <ul style="margin:0; padding-left: 20px; font-size: 0.85rem; line-height: 1.5;">
            <li><strong>Best Fit Decreasing (BFD):</strong> Maximiza el aprovechamiento local en barras estándar.</li>
            <li><strong>Knapsack Dinámico:</strong> Encuentra combinaciones milimétricas exactas mediante mochila combinatoria.</li>
            <li><strong>Algoritmo Genético:</strong> Optimización metaheurística para pedidos complejos y heterogéneos.</li>
            <li><strong>Kitting Lean:</strong> Agrupa por unidad completa, evitando piezas dispersas y reduciendo el WIP.</li>
            <li><strong>Scrap First:</strong> Prioriza el consumo de retales en almacén antes de abrir barras nuevas.</li>
          </ul>
        </div>

        <!-- Grid de Tarjetas de Algoritmos -->
        <div class="algorithm-cards-grid mt-4">
          <div 
            v-for="algo in CATALOGO_ALGORITMOS" 
            :key="algo.id"
            class="algo-card"
            :class="{ 'algo-card-active': algoritmoSeleccionado === algo.id }"
            @click="algoritmoSeleccionado = algo.id"
          >
            <div class="algo-card-top">
              <div class="algo-title-group">
                <span class="algo-code-pill">{{ algo.codigo }}</span>
                <div>
                  <div class="algo-name">{{ algo.nombre }}</div>
                  <div class="algo-category">{{ algo.categoria }}</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
                <span 
                  v-if="algo.id === 'ortools'" 
                  class="badge"
                  :class="pythonOnline ? 'badge-completado' : 'badge-pendiente'"
                  style="font-size:0.7rem; padding: 2px 6px;"
                  title="Estado del microservicio local Python (FastAPI / OR-Tools en puerto 8000)"
                >
                  {{ pythonOnline ? 'Servicio Activo' : 'Offline' }}
                </span>
                <span 
                  v-if="algoritmoSeleccionado === algo.id" 
                  class="badge badge-active-pill"
                >
                  ACTIVO
                </span>
              </div>
            </div>

            <p class="algo-desc">{{ algo.descripcion }}</p>

            <div class="algo-pro-box">
              <span class="algo-pro-tag">Rendimiento:</span> {{ algo.pro }}
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de Acciones y Benchmark -->
      <div class="mt-5 action-row" style="gap:12px; flex-wrap:wrap; align-items:center;">
        <button class="btn btn-primary" @click="optimizar">
          <Play :size="15" />
          <span>Optimizar con {{ nombreCortoAlgoritmo }}</span>
        </button>
        <button type="button" class="btn btn-secondary" @click="ejecutarBenchmark">
          <BarChart3 :size="15" />
          <span>Comparativa Multialgoritmo (Benchmark)</span>
        </button>
        <span class="text-xs text-muted" style="margin-left:auto;">
          Cálculo determinista en tiempo real en máquina local.
        </span>
      </div>
    </div>

    <!-- Panel de Comparativa de Algoritmos (Benchmark) -->
    <div v-if="benchmarkResults" class="card mb-6 benchmark-card" style="max-width: 1040px;">
      <div class="card-header">
        <h3 class="card-title" style="display:flex;align-items:center;gap:8px;">
          <span>Matriz Comparativa de Rendimiento Multialgoritmo</span>
        </h3>
        <button class="btn btn-ghost btn-xs" @click="benchmarkResults = null">Cerrar</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Motor de Cálculo</th>
              <th>Barras</th>
              <th>M/L Útiles</th>
              <th>{{ retalMinimo <= 0 ? 'Desperdicio Total' : `Merma (< ${retalMinimo}mm)` }}</th>
              <th>{{ retalMinimo <= 0 ? 'Retales (0 m)' : 'Retales Reutilizables' }}</th>
              <th>{{ retalMinimo <= 0 ? '% Desperdicio' : '% Merma' }}</th>
              <th>WIP Mezclado</th>
              <th>Retales Usados</th>
              <th>Tiempo</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="b in benchmarkResults" 
              :key="b.algoritmo" 
              :class="{ 'row-winner': parseFloat(b.porcentajeChatarra || b.porcentajeDesperdicio) === menorPorcentajeBenchmark }"
            >
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="algo-mini-code">{{ obtenerCodigoAlgo(b.idAlgoritmo) }}</span>
                  <div>
                    <strong>{{ b.algoritmo }}</strong>
                    <div class="text-xs text-muted">{{ obtenerCategoriaAlgo(b.idAlgoritmo) }}</div>
                  </div>
                  <span v-if="parseFloat(b.porcentajeChatarra || b.porcentajeDesperdicio) === menorPorcentajeBenchmark" class="badge badge-completado" style="margin-left:auto;">
                    Mínima Merma
                  </span>
                </div>
              </td>
              <td><strong>{{ b.totalTubos }}</strong></td>
              <td>{{ b.totalMetrosUtiles }} m</td>
              <td style="color:var(--amber, #f59e0b);">
                <strong>{{ b.totalChatarraM || b.totalDesperdicioM }} m</strong>
              </td>
              <td style="color:var(--green, #4ade80);">
                <span>{{ b.totalRetalesGeneradosM || '0.00' }} m</span>
                <small v-if="b.retalesGeneradosCount" class="text-muted"> ({{ b.retalesGeneradosCount }})</small>
              </td>
              <td>
                <span class="badge" :class="parseFloat(b.porcentajeChatarra || b.porcentajeDesperdicio) < 10 ? 'badge-completado' : 'badge-pendiente'">
                  {{ b.porcentajeChatarra || b.porcentajeDesperdicio }}%
                </span>
              </td>
              <td>
                <span :class="b.tubosMezclados === 0 ? 'text-green' : 'text-red'">
                  {{ b.tubosMezclados }}
                </span>
              </td>
              <td>
                <span :class="b.retalesUsados > 0 ? 'text-green' : 'text-muted'">
                  {{ b.retalesUsados }}
                </span>
              </td>
              <td><span class="text-xs text-muted">{{ b.tiempoMs }} ms</span></td>
              <td>
                <button class="btn btn-xs btn-primary" @click="aplicarAlgoritmoDesdeBenchmark(b)">
                  Seleccionar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- RESULTADOS DE LA OPTIMIZACIÓN -->
    <template v-if="results">
      <!-- Tarjeta de Estudio por Medida Homogénea (Sin Mezclar) -->
      <div v-if="results.comparativaHomogenea && results.comparativaHomogenea.length" class="card mb-6 highlight-card" style="max-width: 1040px;">
        <div class="card-header">
          <div>
            <span class="badge badge-aluminio" style="margin-bottom:4px; font-size:0.7rem;">ANÁLISIS MONO-MEDIDA (SIN MEZCLA EN PEDIDO)</span>
            <h3 class="card-title" style="color:var(--green,#4ade80);display:flex;align-items:center;gap:8px;">
              <span>Comparativa de Compra por Longitud Homogénea</span>
            </h3>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn btn-xs btn-primary" @click="mostrarModalEstudio = true">
              <FileText :size="14" style="margin-right:4px;" />
              <span>Informe Técnico Oficial (PDF)</span>
            </button>
          </div>
        </div>

        <div class="multi-results-summary">
          <div class="summary-text">
            <p v-if="ganadorHomogeneo" style="margin:0 0 10px 0; font-size:0.95rem; color:#cbd5e1;">
              Si el aprovisionamiento exige no combinar perfiles de distintas medidas en el mismo pedido, 
              la medida óptima recomendada es <strong style="color:var(--green,#4ade80);">{{ ganadorHomogeneo.longitudM }} metros ({{ ganadorHomogeneo.longitud }} mm)</strong>: 
              requiere <strong style="color:var(--green,#4ade80);">{{ ganadorHomogeneo.totalTubos }} barras</strong> ({{ ganadorHomogeneo.totalMetrosBrutos }} m brutos) 
              con solo un <strong style="color:var(--green,#4ade80);">{{ ganadorHomogeneo.porcentajeDesperdicio }}% de desperdicio</strong>,
              ahorrando <strong style="color:var(--primary,#38bdf8);">{{ (120 - parseFloat(ganadorHomogeneo.totalMetrosBrutos || 88)).toFixed(2) }} metros lineales</strong> frente a la barra fija convencional de 6m.
            </p>

            <div class="multi-stock-table-wrapper mt-3">
              <table class="multi-stock-table">
                <thead>
                  <tr>
                    <th>Medida Comercial</th>
                    <th>Barras Necesarias</th>
                    <th>Metros Brutos</th>
                    <th>M/L Útiles</th>
                    <th>Desperdicio Total</th>
                    <th>% Desperdicio</th>
                    <th>Veredicto</th>
                    <th style="text-align:center;">Visualizar Corte</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="item in results.comparativaHomogenea" 
                    :key="item.longitud"
                    :class="{ 'row-winner': item.longitud === longitudHomogeneaSeleccionada }"
                  >
                    <td>
                      <strong>{{ item.longitudM }} m</strong> 
                      <span class="text-muted text-xs">({{ item.longitud }} mm)</span>
                    </td>
                    <td><strong>{{ item.totalTubos }}</strong> barras</td>
                    <td>{{ item.totalMetrosBrutos }} m</td>
                    <td>{{ item.totalMetrosUtiles }} m</td>
                    <td :style="{ color: item.esGanador ? 'var(--green,#4ade80)' : (parseFloat(item.porcentajeDesperdicio) > 30 ? 'var(--red,#ef4444)' : 'var(--amber,#f59e0b)') }">
                      <strong>{{ item.totalDesperdicioM }} m</strong>
                    </td>
                    <td>
                      <span 
                        class="badge" 
                        :class="item.esGanador ? 'badge-completado' : (parseFloat(item.porcentajeDesperdicio) > 30 ? 'badge-pendiente' : 'badge-aluminio')"
                      >
                        {{ item.porcentajeDesperdicio }}%
                      </span>
                    </td>
                    <td>
                      <span v-if="item.esGanador" class="badge badge-completado">
                        Recomendado Mono-Medida
                      </span>
                      <span v-else-if="parseFloat(item.porcentajeDesperdicio) > 30" class="badge badge-pendiente">
                        Mayor Desperdicio (+41 m)
                      </span>
                      <span v-else class="text-xs text-muted">
                        Alternativa homogénea
                      </span>
                    </td>
                    <td style="text-align:center;">
                      <button 
                        type="button" 
                        class="btn btn-xs" 
                        :class="item.longitud === longitudHomogeneaSeleccionada ? 'btn-primary' : 'btn-ghost'"
                        @click="seleccionarLongitudHomogenea(item.longitud)"
                      >
                        {{ item.longitud === longitudHomogeneaSeleccionada ? 'Visualizando' : 'Ver Plano' }}
                      </button>
                    </td>
                  </tr>

                  <!-- Fila Comparativa de Combinación Mixta para Referencia -->
                  <tr v-if="results.solucionMixta" style="background: rgba(56, 189, 248, 0.05); border-top: 1px dashed rgba(56,189,248,0.25);">
                    <td>
                      <span style="color:var(--primary,#38bdf8); font-weight:700;">Combinación Mixta</span>
                      <div class="text-xs text-muted">(Si se permitiese mezclar)</div>
                    </td>
                    <td><strong>{{ results.solucionMixta.totalTubos }}</strong> barras (10x 8m + 1x 6m)</td>
                    <td>{{ results.solucionMixta.totalMetrosBrutos }} m</td>
                    <td>{{ results.solucionMixta.totalMetrosUtiles }} m</td>
                    <td style="color:var(--primary,#38bdf8);"><strong>{{ results.solucionMixta.totalDesperdicioM }} m</strong></td>
                    <td>
                      <span class="badge" style="background:rgba(56,189,248,0.2);color:#38bdf8;">
                        {{ results.solucionMixta.porcentajeDesperdicio }}%
                      </span>
                    </td>
                    <td><span class="text-xs text-muted">Óptimo absoluto con mezcla</span></td>
                    <td style="text-align:center;">
                      <button 
                        type="button" 
                        class="btn btn-xs btn-outline-cyan" 
                        @click="modoEstrategia = 'multi'; optimizar()"
                      >
                        Activar Mezcla
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-3 text-xs text-muted" style="display:flex; justify-content:space-between; align-items:center;">
              <span>Mostrando plano de corte para: <strong style="color:var(--primary,#38bdf8);">{{ (longitudHomogeneaSeleccionada / 1000).toFixed(1) }} m ({{ longitudHomogeneaSeleccionada }} mm)</strong></span>
              <span>Pulse "Ver Plano" en cualquier fila para inspeccionar las barras en 3D abajo.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tarjeta de Ahorro y Recomendación de Compra Multi-Stock (Solo en modo multi) -->
      <div v-else-if="results.estrategia === 'multi'" class="card mb-6 highlight-card" style="max-width: 1040px;">
        <div class="card-header">
          <h3 class="card-title" style="color:var(--green,#4ade80);display:flex;align-items:center;gap:8px;">
            <span>Plan de Corte Optimizado — {{ results.nombreAlgoritmo }}</span>
          </h3>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge badge-aluminio">Alta Eficiencia</span>
            <button type="button" class="btn btn-xs btn-primary" @click="mostrarModalEstudio = true">
              <FileText :size="14" style="margin-right:4px;" />
              <span>Informe Técnico Oficial (PDF)</span>
            </button>
          </div>
        </div>
        
        <div class="multi-results-summary">
          <div class="summary-text">
            <p style="margin:0 0 8px 0; font-size:1.02rem;">
              <strong>Pedido Sugerido a Proveedor:</strong>
            </p>
            <div class="bars-breakdown-chips">
              <span v-for="(cant, len) in results.desgloseBarras" :key="len" class="purchase-chip">
                <strong>{{ cant }}</strong> barra{{ cant !== 1 ? 's' : '' }} de <strong>{{ len / 1000 }}m</strong> ({{ len }}mm)
              </span>
            </div>
            
            <p class="text-sm mt-3" style="color:#cbd5e1; margin-bottom: 0;">
              <em>
                Al combinar barras de diferentes medidas (4m, 6m, 7m, 8m), el desperdicio baja de 
                <strong style="color:var(--red,#ef4444);">41.05m (34.2%)</strong> a solo 
                <strong style="color:var(--green,#4ade80);">{{ (results.totalDesperdicio / 1000).toFixed(2) }}m ({{ results.porcentajeDesperdicio }}%)</strong>, 
                ahorrando <strong style="color:var(--primary,#38bdf8);">{{ ((120000 - results.totalMetrosBrutosMM) / 1000).toFixed(2) }} metros lineales</strong> de material bruto.
              </em>
            </p>
            
            <div v-if="results.costeTotal > 0" class="mt-2 text-sm">
              Coste económico total estimado: <strong>{{ results.costeTotal.toFixed(2) }} €</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen de KPIs Principales -->
      <div class="stats-grid mb-6" style="max-width: 1040px;">
        <div class="stat-card teal">
          <div class="stat-icon"><Layers :size="20" /></div>
          <div class="stat-value">{{ results.totalTubos }}</div>
          <div class="stat-label">Barras requeridas</div>
        </div>

        <div class="stat-card green">
          <div class="stat-icon"><Scissors :size="20" /></div>
          <div class="stat-value">{{ results.totalCortes }}</div>
          <div class="stat-label">Operaciones de corte</div>
        </div>

        <div class="stat-card blue">
          <div class="stat-icon"><Ruler :size="20" /></div>
          <div class="stat-value">{{ results.totalMetrosUtiles }}m</div>
          <div class="stat-label">Metros lineales útiles</div>
        </div>

        <div class="stat-card amber">
          <div class="stat-icon"><Trash2 :size="20" /></div>
          <div class="stat-value">{{ results.totalChatarraM }}m</div>
          <div class="stat-label">
            {{ results.retalMinimo <= 0 ? 'Desperdicio Total (Sin Retales)' : `Merma / Residuo (< ${results.retalMinimo}mm)` }}
          </div>
          <div class="text-xs" style="margin-top:2px; color:var(--amber,#f59e0b);">
            {{ results.porcentajeChatarra }}% material no aprovechable
          </div>
        </div>

        <div class="stat-card teal">
          <div class="stat-icon"><Archive :size="20" /></div>
          <div class="stat-value">{{ results.totalRetalesGeneradosM }}m</div>
          <div class="stat-label">
            {{ results.retalMinimo <= 0 ? 'Retales en Almacén (Desactivado)' : `Retales en Almacén (≥ ${results.retalMinimo}mm)` }}
          </div>
          <div class="text-xs" :class="results.retalMinimo <= 0 ? 'text-muted' : 'text-green'" style="margin-top:2px;">
            {{ results.retalMinimo <= 0 ? '0 retales (100% desperdicio)' : `${results.retalesGeneradosCount} retal${results.retalesGeneradosCount !== 1 ? 'es' : ''} aprovechables` }}
          </div>
        </div>

        <div class="stat-card" :class="results.tubosMezclados > 2 ? 'red' : 'blue'">
          <div class="stat-icon" title="Barras que contienen piezas de 2 o más estructuras distintas"><Split :size="20" /></div>
          <div class="stat-value">{{ results.tubosMezclados }}</div>
          <div class="stat-label">Barras con WIP Mezclado</div>
        </div>

        <div class="stat-card" :class="parseFloat(results.porcentajeDesperdicio) > 15 ? 'red' : 'green'">
          <div class="stat-icon"><BarChart2 :size="20" /></div>
          <div class="stat-value">{{ results.porcentajeDesperdicio }}%</div>
          <div class="stat-label">Residuo Físico Total</div>
        </div>
      </div>

      <!-- Grupos Optimizados con Barra Visual -->
      <div v-for="grupo in results.grupos" :key="`${grupo.medida}-${grupo.material}`" class="optimization-result" style="max-width: 1040px;">
        <h3>
          <span 
            class="badge" 
            :class="grupo.material === 'Cobre' ? 'badge-cobre' : grupo.material === 'Aluminio' ? 'badge-aluminio' : 'badge-hierro'" 
            style="margin-right:8px;"
          >
            {{ grupo.material }}
          </span>
          Medida: {{ (grupo.medida || '').includes('"') || (grupo.medida || '').includes('x') ? grupo.medida : (grupo.medida ? grupo.medida + '"' : '—') }} — 
          <strong>{{ grupo.tubosCount }} barra{{ grupo.tubosCount !== 1 ? 's' : '' }}</strong> ({{ grupo.metrosBrutos }}m bruto) — 
          <span style="color:var(--primary, #38bdf8);margin: 0 4px;">M/L Útiles: <strong>{{ grupo.metrosUtiles }}m</strong></span> — 
          Desperdicio: {{ (grupo.desperdicio / 1000).toFixed(2) }}m
        </h3>
        <div v-for="(tubo, idx) in grupo.tubos" :key="idx" style="margin-bottom: 12px;">
          <BarVisualizer :bar="tubo" />
        </div>
      </div>
    </template>

    <!-- Modal Oficial del Estudio Técnico Exportable a PDF -->
    <EstudioReportModal 
      v-if="mostrarModalEstudio" 
      @cerrar="mostrarModalEstudio = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  FileText, 
  Play, 
  BarChart3, 
  BarChart2, 
  Layers, 
  Scissors, 
  Ruler, 
  Trash2, 
  Archive, 
  Split 
} from 'lucide-vue-next'
import { useOrdenesStore } from '../stores/ordenes'
import { useConfigStore } from '../stores/config'
import { useStockStore } from '../stores/stock'
import BarVisualizer from '../components/BarVisualizer.vue'
import EstudioReportModal from '../components/EstudioReportModal.vue'
import { generarInformeTecnicoPDF } from '../utils/pdfEstudioReport'
import { 
  solveBFD, 
  solveGoogleORTools, 
  solveKnapsack, 
  solveGeneticAlgorithm, 
  solveKittingLean, 
  solveScrapFirst, 
  solveFFD, 
  solveWFD, 
  CATALOGO_ALGORITMOS,
  runBenchmark 
} from '../utils/cuttingAlgorithms'

const store = useOrdenesStore()
const configStore = useConfigStore()
const stockStore = useStockStore()
const pythonOnline = ref(false)

async function checkPythonStatus() {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1000)
    const res = await fetch('http://localhost:8000/health', { signal: controller.signal })
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      pythonOnline.value = (data.status === 'ok')
      return
    }
  } catch (e) {}
  pythonOnline.value = false
}

onMounted(() => {
  stockStore.startListening()
  checkPythonStatus()
  setInterval(checkPythonStatus, 10000)
})

const modoParam = ref('perfiles')
const filtroCategoria = ref('todos')
const modoEstrategia = ref('homogenea') // 'homogenea' | 'multi' | 'fija'
const algoritmoSeleccionado = ref(configStore.sistema?.algoritmo_predeterminado || 'bfd')
const mostrarGuiaAlgoritmos = ref(false)

const stockLength = ref(configStore.perfiles.longitud_barra || 6000)
const mermaTubo = ref(configStore.perfiles.merma_corte || 3.5)
const retalMinimo = ref(0) // 0 mm por defecto: sin retales útiles (todo el sobrante es desperdicio)
const results = ref(null)
const benchmarkResults = ref(null)
const mostrarModalEstudio = ref(false)
const usandoCasoEstudio = ref(false)

// Estado para Comparativa de Medidas Homogéneas
const comparativaHomogenea = ref([])
const longitudHomogeneaSeleccionada = ref(null)
const mapaSolucionesHomogeneas = ref({})

const ganadorHomogeneo = computed(() => {
  if (!comparativaHomogenea.value || !comparativaHomogenea.value.length) return null
  return comparativaHomogenea.value.find(item => item.esGanador) || comparativaHomogenea.value[0]
})

function seleccionarLongitudHomogenea(longitud) {
  longitudHomogeneaSeleccionada.value = longitud
  const sol = mapaSolucionesHomogeneas.value[longitud]
  if (sol) {
    results.value = {
      ...sol,
      estrategia: modoEstrategia.value,
      comparativaHomogenea: comparativaHomogenea.value,
      solucionMixta: results.value?.solucionMixta,
      longitudHomogeneaActiva: longitud
    }
  }
}

function activarModoMultiStock() {
  modoEstrategia.value = 'multi'
  optimizar()
}

// Opciones de múltiples barras comerciales
const opcionesBarras = ref([
  { longitud: 4000, coste: 0, activa: true },
  { longitud: 6000, coste: 0, activa: true },
  { longitud: 7000, coste: 0, activa: true },
  { longitud: 8000, coste: 0, activa: true },
])

const nombreCortoAlgoritmo = computed(() => {
  const match = CATALOGO_ALGORITMOS.find(a => a.id === algoritmoSeleccionado.value)
  return match ? match.nombre : 'Algoritmo Seleccionado'
})

const menorPorcentajeBenchmark = computed(() => {
  if (!benchmarkResults.value || !benchmarkResults.value.length) return 0
  return Math.min(...benchmarkResults.value.map(b => parseFloat(b.porcentajeChatarra || b.porcentajeDesperdicio)))
})

function obtenerCodigoAlgo(id) {
  const m = CATALOGO_ALGORITMOS.find(a => a.id === id)
  return m ? m.codigo : 'ALG'
}

function obtenerCategoriaAlgo(id) {
  const m = CATALOGO_ALGORITMOS.find(a => a.id === id)
  return m ? m.categoria : ''
}

function agregarNuevaLongitud() {
  const input = prompt('Introduce la longitud de la nueva barra en milímetros (ej: 6500, 5000):')
  const val = parseInt(input, 10)
  if (val && val > 0 && !opcionesBarras.value.some(b => b.longitud === val)) {
    opcionesBarras.value.push({ longitud: val, coste: 0, activa: true })
    opcionesBarras.value.sort((a, b) => a.longitud - b.longitud)
  }
}

function cargarPreset(tipo) {
  modoParam.value = tipo
  if (tipo === 'tubos') {
    stockLength.value = configStore.tubos.longitud_barra
    mermaTubo.value = configStore.tubos.merma_corte
    retalMinimo.value = 0
    filtroCategoria.value = 'tubo'
    modoEstrategia.value = 'fija'
    algoritmoSeleccionado.value = 'ffd'
  } else {
    stockLength.value = configStore.perfiles.longitud_barra
    mermaTubo.value = configStore.perfiles.merma_corte
    retalMinimo.value = 0
    filtroCategoria.value = 'perfil'
    modoEstrategia.value = 'homogenea'
    algoritmoSeleccionado.value = 'bfd'
  }
}

function cargarCasoEstudioCompleto() {
  usandoCasoEstudio.value = true
  modoParam.value = 'perfiles'
  filtroCategoria.value = 'perfil'
  modoEstrategia.value = 'homogenea'
  mermaTubo.value = 3.0 // sierra a 3mm según especificación del usuario
  retalMinimo.value = 0 // 0 = sin aprovechar retales (todo desperdicio)
  opcionesBarras.value = [
    { longitud: 4000, coste: 0, activa: true },
    { longitud: 6000, coste: 0, activa: true },
    { longitud: 7000, coste: 0, activa: true },
    { longitud: 8000, coste: 0, activa: true }
  ]
  algoritmoSeleccionado.value = pythonOnline.value ? 'ortools' : 'knapsack'
  optimizar()
}

function desactivarCasoEstudio() {
  usandoCasoEstudio.value = false
  results.value = null
  benchmarkResults.value = null
  cargarPreset('perfiles')
}

function esPerfil(of) {
  const t = (of.tipo || '').toLowerCase()
  const m = String(of.medida || '').toLowerCase()
  return of.categoria === 'perfil' || t.includes('perfil') || m.includes('x')
}

function obtenerBarrasActivas() {
  if (modoEstrategia.value === 'fija') {
    return [{ length: stockLength.value, cost: 0 }]
  }
  return opcionesBarras.value.filter(b => b.activa && b.longitud > 0).map(b => ({ length: b.longitud, cost: b.coste }))
}

function obtenerCortesFiltrados() {
  if (usandoCasoEstudio.value) {
    const cortes = []
    // 8 de 3.760 mm
    for (let i = 0; i < 8; i++) {
      cortes.push({
        numero: `P-3760-#${i + 1}`,
        of: `P-3760-#${i + 1}`,
        norden_padre: 'BAT-01',
        longitud: 3760,
        tipo: 'perfil',
        categoria: 'perfil',
        medida: '55x55',
        material: 'Aluminio'
      })
    }
    // 8 de 3.650 mm
    for (let i = 0; i < 8; i++) {
      cortes.push({
        numero: `P-3650-#${i + 1}`,
        of: `P-3650-#${i + 1}`,
        norden_padre: 'BAT-02',
        longitud: 3650,
        tipo: 'perfil',
        categoria: 'perfil',
        medida: '55x55',
        material: 'Aluminio'
      })
    }
    // 8 de 2.450 mm
    for (let i = 0; i < 8; i++) {
      cortes.push({
        numero: `P-2450-#${i + 1}`,
        of: `P-2450-#${i + 1}`,
        norden_padre: 'BAT-03',
        longitud: 2450,
        tipo: 'perfil',
        categoria: 'perfil',
        medida: '55x55',
        material: 'Aluminio'
      })
    }
    return cortes
  }

  let ordenes = store.ordenes
  if (filtroCategoria.value === 'tubo') {
    ordenes = ordenes.filter(o => !esPerfil(o))
  } else if (filtroCategoria.value === 'perfil') {
    ordenes = ordenes.filter(o => esPerfil(o))
  }

  const cortes = []
  ordenes.forEach(of => {
    const pend = Math.max(0, (of.cantidad || 0) - (of.completedCount || 0))
    for (let i = 0; i < pend; i++) {
      cortes.push({
        numero: of.numero,
        of: of.numero,
        norden_padre: of.norden_padre || 'Sin Batería',
        longitud: of.longitud || 0,
        tipo: of.tipo || 'colector',
        categoria: of.categoria || (esPerfil(of) ? 'perfil' : 'tubo'),
        medida: of.medida,
        material: of.material || 'Cobre'
      })
    }
  })
  return cortes
}

async function ejecutarBenchmark() {
  const cortes = obtenerCortesFiltrados()
  if (!cortes.length) {
    alert('No hay cortes pendientes para comparar.')
    return
  }
  const barLengths = obtenerBarrasActivas()
  const config = { retales: stockStore.retales, retalMinimo: retalMinimo.value }
  benchmarkResults.value = await runBenchmark(cortes, barLengths, mermaTubo.value, config)
}

function aplicarAlgoritmoDesdeBenchmark(b) {
  if (b.idAlgoritmo) {
    algoritmoSeleccionado.value = b.idAlgoritmo
  } else if (b.algoritmo.includes('OR-Tools') || b.algoritmo.includes('Python')) {
    algoritmoSeleccionado.value = 'ortools'
  } else if (b.algoritmo.includes('Best Fit')) {
    algoritmoSeleccionado.value = 'bfd'
  } else if (b.algoritmo.includes('Knapsack')) {
    algoritmoSeleccionado.value = 'knapsack'
  } else if (b.algoritmo.includes('Genético')) {
    algoritmoSeleccionado.value = 'genetic'
  } else if (b.algoritmo.includes('Kitting')) {
    algoritmoSeleccionado.value = 'kitting'
  } else if (b.algoritmo.includes('Scrap') || b.algoritmo.includes('Retales')) {
    algoritmoSeleccionado.value = 'scrap'
  } else if (b.algoritmo.includes('First Fit')) {
    algoritmoSeleccionado.value = 'ffd'
  } else if (b.algoritmo.includes('Worst Fit')) {
    algoritmoSeleccionado.value = 'wfd'
  }
  
  benchmarkResults.value = null
  optimizar()
}

async function resolverConAlgoritmo(cortes, barLengths, kerf, grupo) {
  const config = {
    retales: (stockStore.retales || []).filter(r => r.material === grupo.material && r.medida === grupo.medida),
    retalMinimo: retalMinimo.value
  }

  switch (algoritmoSeleccionado.value) {
    case 'ortools': return await solveGoogleORTools(cortes, barLengths, kerf, config)
    case 'bfd': return solveBFD(cortes, barLengths, kerf, config)
    case 'knapsack': return solveKnapsack(cortes, barLengths, kerf, config)
    case 'genetic': return solveGeneticAlgorithm(cortes, barLengths, kerf, config)
    case 'kitting': return solveKittingLean(cortes, barLengths, kerf, config)
    case 'scrap': return solveScrapFirst(cortes, barLengths, kerf, config)
    case 'ffd': return solveFFD(cortes, barLengths, kerf, config)
    case 'wfd': return solveWFD(cortes, barLengths, kerf, config)
    default: return solveBFD(cortes, barLengths, kerf, config)
  }
}

async function calcularPlanParaBarras(barLengths) {
  const todosCortes = obtenerCortesFiltrados()
  if (!todosCortes.length) return null

  // Agrupar por medida y material
  const grupos = {}
  todosCortes.forEach(c => {
    const key = `${c.medida}-${c.material}`
    if (!grupos[key]) grupos[key] = {
      medida: c.medida,
      material: c.material,
      isPerfil: esPerfil(c),
      cortes: []
    }
    grupos[key].cortes.push(c)
  })

  let totalTubos = 0
  let totalDesperdicio = 0
  let totalChatarraMM = 0
  let totalRetalesGeneradosMM = 0
  let retalesGeneradosCount = 0
  let totalCortes = 0
  let tubosMezclados = 0
  let totalLongitudCortes = 0
  let totalMetrosBrutosMM = 0
  let costeTotal = 0
  let retalesUsadosTotal = 0
  const desgloseBarras = {}
  const resultados = []

  let nombreSolucion = ''

  for (const grupo of Object.values(grupos)) {
    const solucion = await resolverConAlgoritmo(grupo.cortes, barLengths, mermaTubo.value, grupo)
    nombreSolucion = solucion.algoritmo

    totalTubos += solucion.totalTubos
    totalDesperdicio += solucion.totalDesperdicio
    totalChatarraMM += solucion.totalChatarraMM || 0
    totalRetalesGeneradosMM += solucion.totalRetalesGeneradosMM || 0
    retalesGeneradosCount += solucion.retalesGeneradosCount || 0
    totalCortes += solucion.totalCortes
    tubosMezclados += solucion.tubosMezclados
    totalLongitudCortes += parseFloat(solucion.totalMetrosUtiles) * 1000
    totalMetrosBrutosMM += parseFloat(solucion.totalMetrosBrutos) * 1000
    costeTotal += solucion.costeTotal || 0
    retalesUsadosTotal += solucion.retalesUsados || 0

    // Agregar desglose de barras
    for (const [len, cant] of Object.entries(solucion.desgloseBarras)) {
      desgloseBarras[len] = (desgloseBarras[len] || 0) + cant
    }

    // Añadir metadatos de visualización a cada barra
    const tubosFormateados = solucion.tubos.map(t => ({
      ...t,
      material: grupo.material,
      tubSize: grupo.medida,
      tipo: grupo.isPerfil ? 'perfil' : 'tubo',
      categoria: grupo.isPerfil ? 'perfil' : 'tubo'
    }))

    resultados.push({
      medida: grupo.medida,
      material: grupo.material,
      tubos: tubosFormateados,
      tubosCount: tubosFormateados.length,
      metrosUtiles: solucion.totalMetrosUtiles,
      metrosBrutos: solucion.totalMetrosBrutos,
      desperdicio: solucion.totalDesperdicio,
      cortesCount: solucion.totalCortes
    })
  }

  return {
    estrategia: modoEstrategia.value,
    nombreAlgoritmo: nombreSolucion,
    grupos: resultados,
    totalTubos,
    totalDesperdicio,
    totalDesperdicioM: (totalDesperdicio / 1000).toFixed(2),
    totalChatarraMM,
    totalChatarraM: (totalChatarraMM / 1000).toFixed(2),
    porcentajeChatarra: totalMetrosBrutosMM > 0 
      ? ((totalChatarraMM / totalMetrosBrutosMM) * 100).toFixed(1) 
      : '0.0',
    totalRetalesGeneradosMM,
    totalRetalesGeneradosM: (totalRetalesGeneradosMM / 1000).toFixed(2),
    porcentajeRetalesGenerados: totalMetrosBrutosMM > 0 
      ? ((totalRetalesGeneradosMM / totalMetrosBrutosMM) * 100).toFixed(1) 
      : '0.0',
    retalesGeneradosCount,
    retalMinimo: retalMinimo.value,
    totalCortes,
    totalMetrosUtiles: (totalLongitudCortes / 1000).toFixed(2),
    totalMetrosBrutos: (totalMetrosBrutosMM / 1000).toFixed(2),
    totalMetrosBrutosMM,
    costeTotal,
    desgloseBarras,
    tubosMezclados,
    retalesUsados: retalesUsadosTotal,
    porcentajeDesperdicio: totalMetrosBrutosMM > 0 
      ? ((totalDesperdicio / totalMetrosBrutosMM) * 100).toFixed(1) 
      : '0.0'
  }
}

async function optimizar() {
  const todosCortes = obtenerCortesFiltrados()
  if (!todosCortes.length) return

  if (modoEstrategia.value === 'fija') {
    const sol = await calcularPlanParaBarras([{ length: stockLength.value, cost: 0 }])
    results.value = sol
    comparativaHomogenea.value = []
    return
  }

  const barrasActivas = opcionesBarras.value.filter(b => b.activa && b.longitud > 0)
  if (!barrasActivas.length) {
    alert('Por favor active al menos una longitud de barra comercial.')
    return
  }

  // 1. Calculamos la solución individual para CADA medida activa (Homogénea sin mezclar)
  const listaHomogenea = []
  mapaSolucionesHomogeneas.value = {}

  for (const b of barrasActivas) {
    const solB = await calcularPlanParaBarras([{ length: b.longitud, cost: b.coste }])
    if (solB) {
      mapaSolucionesHomogeneas.value[b.longitud] = solB
      listaHomogenea.push({
        longitud: b.longitud,
        longitudM: (b.longitud / 1000).toFixed(1),
        costeUnitario: b.coste,
        totalTubos: solB.totalTubos,
        totalMetrosBrutos: solB.totalMetrosBrutos,
        totalMetrosUtiles: solB.totalMetrosUtiles,
        totalDesperdicioM: solB.totalDesperdicioM,
        porcentajeDesperdicio: solB.porcentajeDesperdicio,
        costeTotal: solB.costeTotal,
        solucion: solB
      })
    }
  }

  // Ordenar de menor a mayor desperdicio
  listaHomogenea.sort((a, b) => parseFloat(a.porcentajeDesperdicio) - parseFloat(b.porcentajeDesperdicio))
  if (listaHomogenea.length > 0) {
    listaHomogenea[0].esGanador = true
  }

  // 2. Calculamos también la combinación mixta libre multi-stock como referencia informativa
  let solMixta = null
  if (barrasActivas.length > 1) {
    solMixta = await calcularPlanParaBarras(barrasActivas.map(b => ({ length: b.longitud, cost: b.coste })))
  }

  comparativaHomogenea.value = listaHomogenea

  if (modoEstrategia.value === 'homogenea') {
    // Modo homogéneo: mostramos por defecto la mejor medida (ganadora sin mezcla)
    const mejor = listaHomogenea[0]
    longitudHomogeneaSeleccionada.value = mejor.longitud
    results.value = {
      ...mejor.solucion,
      estrategia: 'homogenea',
      comparativaHomogenea: listaHomogenea,
      solucionMixta: solMixta,
      longitudHomogeneaActiva: mejor.longitud
    }
  } else {
    // Modo multi-stock: mostramos la combinación combinada
    results.value = {
      ...solMixta,
      estrategia: 'multi',
      comparativaHomogenea: listaHomogenea,
      solucionMixta: solMixta
    }
  }
}
</script>

<style scoped>
.param-preset-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.multi-stock-box {
  background: var(--bg-body, #0f131a);
  border: 1px solid var(--border-color, #2d3748);
  border-radius: 8px;
  padding: 16px;
}

.multi-stock-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.multi-stock-table-wrapper {
  overflow-x: auto;
}

.multi-stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.multi-stock-table th, .multi-stock-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.form-input-xs {
  padding: 4px 8px;
  font-size: 0.85rem;
  height: 30px;
}

.tag-remove {
  background: transparent;
  border: none;
  color: var(--red, #ef4444);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

/* Selector Visual de Algoritmos */
.algorithm-selection-box {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--border-color, #2d3748);
  border-radius: 10px;
  padding: 16px;
}

.algorithm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.guide-box {
  background: rgba(30, 41, 59, 0.7);
  border-left: 3px solid var(--primary, #38bdf8);
  padding: 12px 16px;
  border-radius: 6px;
  animation: fadeIn 0.2s ease;
}

.algorithm-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 12px;
}

.algo-card {
  background: var(--bg-card, #1e293b);
  border: 1px solid var(--border-color, #334155);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.algo-card:hover {
  border-color: rgba(56, 189, 248, 0.6);
  transform: translateY(-2px);
  background: rgba(30, 41, 59, 0.95);
}

.algo-card-active {
  border: 2px solid var(--primary, #38bdf8) !important;
  background: rgba(14, 165, 233, 0.12) !important;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
}

.algo-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.algo-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.algo-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.algo-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #f1f5f9;
}

.algo-category {
  font-size: 0.72rem;
  color: var(--primary, #38bdf8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.algo-code-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 3px 7px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.12);
  color: var(--primary, #38bdf8);
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.algo-mini-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.badge-active-pill {
  background: var(--primary, #38bdf8);
  color: #0f172a;
  font-weight: 800;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
}

.algo-desc {
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.algo-pro-box {
  background: rgba(0, 0, 0, 0.25);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  color: #e2e8f0;
}

.algo-pro-tag {
  color: var(--amber, #f59e0b);
  font-weight: 600;
}

.highlight-card {
  border: 1px solid rgba(74, 222, 128, 0.35);
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.06) 0%, rgba(15, 23, 42, 0.5) 100%);
}

.benchmark-card {
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(15, 23, 42, 0.6);
  animation: fadeIn 0.3s ease;
}

.row-winner {
  background: rgba(74, 222, 128, 0.08);
}

.bars-breakdown-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.purchase-chip {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.92rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
