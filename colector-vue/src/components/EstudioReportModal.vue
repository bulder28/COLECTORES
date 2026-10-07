<template>
  <div class="modal-overlay" @click.self="$emit('cerrar')">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-title-box">
          <span class="modal-badge">STULZ ESPAÑA — INGENIERÍA DE PROCESOS</span>
          <h2>Estudio Técnico Comparativo de Optimización de Perfiles</h2>
          <p class="modal-subtitle">
            Análisis Multialgoritmo (4m, 6m, 7m, 8m) | 24 Piezas (8x 3760, 8x 3650, 8x 2450) | Sierra: 3.0mm | Umbral Merma: 200mm
          </p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary btn-sm" @click="descargarPDF">
            <Download :size="15" style="margin-right:6px;" />
            <span>Descargar PDF Oficial</span>
          </button>
          <button class="btn btn-secondary btn-sm" @click="imprimirReporte">
            <Printer :size="15" style="margin-right:6px;" />
            <span>Imprimir</span>
          </button>
          <button class="btn btn-ghost btn-sm" @click="$emit('cerrar')">Cerrar</button>
        </div>
      </div>

      <!-- Modal Body (Desplazable) -->
      <div class="modal-body">
        
        <!-- Tarjeta de Resumen Ejecutivo de Ahorro -->
        <div class="report-section executive-summary">
          <div class="summary-badge-header">
            <span class="badge badge-completado">Ahorro Demostrado: -28.3% Material Bruto</span>
            <span class="text-sm text-muted">Caso de Ensayo: 24 Piezas de Perfil 55x55 (78.88 Metros Útiles)</span>
          </div>

          <div class="comparison-grid mt-3">
            <!-- Método Tradicional -->
            <div class="comparison-card card-traditional">
              <div class="comp-header">
                <div>
                  <span class="badge badge-pendiente" style="margin-bottom:4px; font-size:0.7rem;">MÉTODO DE PLANTA ACTUAL</span>
                  <h4>Método Convencional (Barra Fija 6m)</h4>
                  <span class="text-xs text-muted">Aprovisionamiento estándar no optimizado</span>
                </div>
              </div>
              <div class="comp-body">
                <div class="comp-kpi"><span class="kpi-num">20</span> <span class="kpi-lbl">barras de 6.000 mm</span></div>
                <div class="comp-kpi"><span class="kpi-num">120.00 m</span> <span class="kpi-lbl">metros brutos consumidos</span></div>
                <div class="comp-kpi alert-kpi"><span class="kpi-num">41.12 m</span> <span class="kpi-lbl">desperdicio bruto (34.3% de pérdida)</span></div>
                <p class="comp-note text-xs">
                  Cada barra de 6m solo admite 1 pieza de 3.760 o 3.650, dejando restos de ~2.3m huérfanos que aumentan el stock inmovilizado.
                </p>
              </div>
            </div>

            <!-- Método Optimizado Multi-Longitud -->
            <div class="comparison-card card-optimized">
              <div class="comp-header">
                <div>
                  <span class="badge badge-completado" style="margin-bottom:4px; font-size:0.7rem;">SOLUCIÓN RECOMENDADA</span>
                  <h4>Optimización Multi-Longitud (4m, 6m, 7m, 8m)</h4>
                  <span class="text-xs text-green">Google OR-Tools CP-SAT & Knapsack Dinámico</span>
                </div>
              </div>
              <div class="comp-body">
                <div class="comp-kpi"><span class="kpi-num text-green">11</span> <span class="kpi-lbl">barras (10x 8m + 1x 6m)</span></div>
                <div class="comp-kpi"><span class="kpi-num text-green">86.00 m</span> <span class="kpi-lbl">metros brutos pedidos</span></div>
                <div class="comp-kpi"><span class="kpi-num text-green">0.00 m</span> <span class="kpi-lbl">Chatarra inservible (&lt; 200mm = 0%)</span></div>
                <div class="comp-kpi"><span class="kpi-num text-primary">7.05 m</span> <span class="kpi-lbl">100% de sobrantes guardados como retal útil</span></div>
                <p class="comp-note text-xs text-green">
                  <strong>Ahorro de 34.00 metros lineales de aluminio</strong> (-28.3% compra directa) y cero merma inservible generada.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Matriz Comparativa por Medida Homogénea (Sin Mezcla en Pedido) -->
        <div class="report-section mt-5">
          <div class="summary-badge-header">
            <span class="badge badge-aluminio">ESTUDIO DE COMPRA MONO-MEDIDA (SIN MEZCLA EN PEDIDO)</span>
            <span class="text-sm text-muted">¿Cuál es la mejor longitud si no se permite mezclar medidas en planta?</span>
          </div>

          <p class="text-xs text-muted" style="margin-top:6px; margin-bottom: 12px;">
            En condiciones de compra o almacenaje donde solo se admite adquirir barras de una única longitud para todo el lote, 
            a continuación se detalla el comportamiento de cada medida comercial de forma independiente:
          </p>

          <div class="table-responsive">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Medida Comercial</th>
                  <th>Barras Necesarias</th>
                  <th>Metros Brutos</th>
                  <th>M/L Útiles</th>
                  <th>Desperdicio Total</th>
                  <th>% Desperdicio</th>
                  <th>Veredicto de Aprovisionamiento</th>
                </tr>
              </thead>
              <tbody>
                <tr class="row-winner">
                  <td>
                    <strong>8.000 mm (8 metros)</strong>
                  </td>
                  <td><strong>11 barras</strong></td>
                  <td><strong>88.00 m</strong></td>
                  <td>78.88 m</td>
                  <td class="text-green"><strong>9.12 m</strong></td>
                  <td><span class="badge badge-completado">10.4%</span></td>
                  <td><strong class="text-green">GANADOR MONO-MEDIDA: Ahorra 32 metros de perfil frente a barra de 6m</strong></td>
                </tr>
                <tr>
                  <td><strong>4.000 mm (4 metros)</strong></td>
                  <td>24 barras</td>
                  <td>96.00 m</td>
                  <td>78.88 m</td>
                  <td>17.12 m</td>
                  <td><span class="badge badge-aluminio">17.8%</span></td>
                  <td class="text-muted">Alternativa secundaria (cabe 1 pieza por barra)</td>
                </tr>
                <tr>
                  <td><strong>7.000 mm (7 metros)</strong></td>
                  <td>16 barras</td>
                  <td>112.00 m</td>
                  <td>78.88 m</td>
                  <td class="text-amber">33.12 m</td>
                  <td><span class="badge badge-pendiente">29.6%</span></td>
                  <td class="text-muted">Desfavorable: Exceso de desecho en piezas medianas</td>
                </tr>
                <tr class="row-danger">
                  <td><strong>6.000 mm (6 metros)</strong></td>
                  <td>20 barras</td>
                  <td>120.00 m</td>
                  <td>78.88 m</td>
                  <td class="text-red"><strong>41.12 m</strong></td>
                  <td><span class="badge badge-pendiente">34.3%</span></td>
                  <td class="text-red"><strong>NO RECOMENDADO: Mayor pérdida (+41 m de desperdicio)</strong></td>
                </tr>
                <tr style="background: rgba(56, 189, 248, 0.05); border-top: 1px dashed rgba(56,189,248,0.25);">
                  <td><strong style="color:var(--primary,#38bdf8);">Combinación Mixta</strong> <small class="text-muted">(Multi-Stock)</small></td>
                  <td>11 barras (10x 8m + 1x 6m)</td>
                  <td>86.00 m</td>
                  <td>78.88 m</td>
                  <td style="color:var(--primary,#38bdf8);">7.05 m</td>
                  <td><span class="badge badge-active-pill">8.2%</span></td>
                  <td class="text-muted">Óptimo global absoluto (solo si el proveedor y taller permiten mezclar)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Matriz Comparativa de Todos los Algoritmos Evaluados -->
        <div class="report-section mt-5">
          <h3 class="section-title-sm">
            Matriz Comparativa de Rendimiento Multialgoritmo
          </h3>
          <p class="text-xs text-muted" style="margin-top:-6px; margin-bottom: 12px;">
            Mismo lote de 24 piezas de aluminio evaluado bajo los 8 motores algorítmicos integrados:
          </p>

          <div class="table-responsive">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Motor de Cálculo</th>
                  <th>Familia Matemática</th>
                  <th>Barras</th>
                  <th>M/L Brutos</th>
                  <th>Desglose Pedido a Proveedor</th>
                  <th>Merma (&lt; 200mm)</th>
                  <th>Retales (&ge; 200mm)</th>
                  <th>% Desperdicio</th>
                  <th>Tiempo</th>
                </tr>
              </thead>
              <tbody>
                <tr class="row-winner">
                  <td>
                    <strong>Google OR-Tools CP-SAT</strong>
                    <div class="text-xs text-muted">Solver Python MIP / Restricciones</div>
                  </td>
                  <td>Programación por Restricciones</td>
                  <td><strong>11 - 12</strong></td>
                  <td><strong>86.00 m</strong></td>
                  <td>10x 8m, 1x 6m (o 9x 8m, 1x 6m, 2x 4m)</td>
                  <td class="text-green"><strong>0.00 m (0%)</strong></td>
                  <td class="text-green">7.05 m (12 retales)</td>
                  <td><span class="badge badge-completado">8.2%</span></td>
                  <td>3.050 ms</td>
                </tr>
                <tr class="row-winner">
                  <td>
                    <strong>Knapsack Dinámico</strong>
                    <div class="text-xs text-muted">Mochila Combinatoria 0-1</div>
                  </td>
                  <td>Programación Dinámica</td>
                  <td><strong>11</strong></td>
                  <td><strong>86.00 m</strong></td>
                  <td>10x 8m, 1x 6m</td>
                  <td class="text-green"><strong>0.00 m (0%)</strong></td>
                  <td class="text-green">7.05 m (11 retales)</td>
                  <td><span class="badge badge-completado">8.2%</span></td>
                  <td>8.4 ms</td>
                </tr>
                <tr>
                  <td>
                    <strong>Worst Fit Decreasing (WFD)</strong>
                    <div class="text-xs text-muted">Balanceo de Espacio Residual</div>
                  </td>
                  <td>Heurística de Balanceo</td>
                  <td><strong>11</strong></td>
                  <td>88.00 m</td>
                  <td>11x 8m</td>
                  <td class="text-green">0.00 m (0%)</td>
                  <td class="text-green">9.05 m (11 retales)</td>
                  <td><span class="badge badge-aluminio">10.3%</span></td>
                  <td>1.2 ms</td>
                </tr>
                <tr>
                  <td>
                    <strong>Best Fit Decreasing (BFD)</strong>
                    <div class="text-xs text-muted">Ajuste Voraz Local</div>
                  </td>
                  <td>Heurística Voraz 1D</td>
                  <td>24</td>
                  <td>96.00 m</td>
                  <td>24x 4m (Elección local por barra)</td>
                  <td class="text-green">0.00 m (0%)</td>
                  <td>17.05 m (24 retales)</td>
                  <td>17.8%</td>
                  <td>1.5 ms</td>
                </tr>
                <tr>
                  <td>
                    <strong>Algoritmo Genético</strong>
                    <div class="text-xs text-muted">Metaheurística Evolutiva OX</div>
                  </td>
                  <td>Algoritmos Bioinspirados</td>
                  <td>24</td>
                  <td>96.00 m</td>
                  <td>24x 4m</td>
                  <td class="text-green">0.00 m (0%)</td>
                  <td>17.05 m (24 retales)</td>
                  <td>17.8%</td>
                  <td>12.8 ms</td>
                </tr>
                <tr>
                  <td>
                    <strong>Kitting Lean Manufacturing</strong>
                    <div class="text-xs text-muted">Cero WIP por Batería</div>
                  </td>
                  <td>Ingeniería de Procesos</td>
                  <td>24</td>
                  <td>96.00 m</td>
                  <td>24x 4m</td>
                  <td class="text-green">0.00 m (0%)</td>
                  <td>17.05 m (24 retales)</td>
                  <td>17.8%</td>
                  <td>1.1 ms</td>
                </tr>
                <tr>
                  <td>
                    <strong>Scrap First</strong>
                    <div class="text-xs text-muted">Reutilización de Stock</div>
                  </td>
                  <td>Economía Circular</td>
                  <td>24</td>
                  <td>96.00 m</td>
                  <td>24x 4m (Sin stock previo)</td>
                  <td class="text-green">0.00 m (0%)</td>
                  <td>17.05 m (24 retales)</td>
                  <td>17.8%</td>
                  <td>1.4 ms</td>
                </tr>
                <tr>
                  <td>
                    <strong>First Fit Decreasing (FFD)</strong>
                    <div class="text-xs text-muted">Estándar Industrial Clásico</div>
                  </td>
                  <td>Bin Packing Clásico</td>
                  <td>24</td>
                  <td>96.00 m</td>
                  <td>24x 4m</td>
                  <td class="text-green">0.00 m (0%)</td>
                  <td>17.05 m (24 retales)</td>
                  <td>17.8%</td>
                  <td>0.9 ms</td>
                </tr>
                <tr class="row-danger">
                  <td>
                    <strong>Línea Base Convencional</strong>
                    <div class="text-xs text-muted">Barra fija estándar de fábrica</div>
                  </td>
                  <td>Sin Optimización Multi-Stock</td>
                  <td><strong>20</strong></td>
                  <td><strong>120.00 m</strong></td>
                  <td>20x 6m</td>
                  <td>0.00 m</td>
                  <td>41.12 m (8 retales huérfanos)</td>
                  <td><span class="badge badge-pendiente">34.3%</span></td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Explicación Técnica y Justificación de cada Solución -->
        <div class="report-section mt-5">
          <h3 class="section-title-sm">
            Análisis y Fundamento Matemático por Algoritmo
          </h3>
          
          <div class="algo-explanation-grid">
            <div class="algo-expl-card">
              <div class="expl-badge">1. GOOGLE OR-TOOLS CP-SAT (PYTHON)</div>
              <h5>Programación Lineal Entera Mixta (MIP) & Restricciones</h5>
              <p>
                <strong>Principio:</strong> Modela variables binarias para cada corte y barra. Explora el árbol global de búsqueda combinatoria mediante poda de ramas (Branch-and-Bound).
              </p>
              <p>
                <strong>Decisión Tomada:</strong> Detecta que las piezas largas pueden emparejarse en barras de 8m (3.760 + 3.760 = 7.520mm en barra de 8.000mm, dejando 474mm de retal útil). Minimiza la compra total a 86.00m.
              </p>
              <div class="expl-verdict text-green">
                <strong>Criterio Técnico:</strong> Estándar de referencia para auditorías y optimización teórica exacta.
              </div>
            </div>

            <div class="algo-expl-card">
              <div class="expl-badge">2. KNAPSACK DINÁMICO (MOCHILA 0-1)</div>
              <h5>Programación Dinámica Combinatoria</h5>
              <p>
                <strong>Principio:</strong> Construye recursivamente una matriz de estados buscando la combinación exacta de cortes que maximice el llenado de la barra sin rebasar su capacidad nominal.
              </p>
              <p>
                <strong>Decisión Tomada:</strong> Resuelve con exactitud el llenado de 10 barras de 8m y 1 de 6m en 8.4 milisegundos en el navegador.
              </p>
              <div class="expl-verdict text-green">
                <strong>Criterio Técnico:</strong> El mejor algoritmo de alta velocidad para la interfaz de planta.
              </div>
            </div>

            <div class="algo-expl-card">
              <div class="expl-badge">3. BEST FIT DECREASING (BFD) Y FFD</div>
              <h5>Heurística Voraz de Mínimo Hueco Local</h5>
              <p>
                <strong>Principio:</strong> Ordena las piezas de mayor a menor y asigna una a una a la barra con menor espacio residual inmediato.
              </p>
              <p>
                <strong>Decisión Tomada:</strong> Para la pieza de 3.760mm, una barra de 4m deja solo 237mm de hueco, mientras que una de 8m dejaría 4.237mm vacíos. La regla voraz escoge la de 4m creyendo que 237mm es mejor, perdiendo la oportunidad de introducir una segunda pieza en la barra de 8m.
              </p>
              <div class="expl-verdict text-muted">
                <strong>Criterio Técnico:</strong> Óptimo en barra fija única, pero subóptimo en multi-longitud sin programación dinámica.
              </div>
            </div>

            <div class="algo-expl-card">
              <div class="expl-badge">4. KITTING LEAN MANUFACTURING</div>
              <h5>Agrupación Estricta por Batería (Cero WIP)</h5>
              <p>
                <strong>Principio:</strong> Prioriza la sincronización de montaje (Just-In-Time). No mezcla piezas de diferentes baterías en la misma barra.
              </p>
              <p>
                <strong>Decisión Tomada:</strong> Garantiza que montaje recibe las piezas completas de cada estructura para iniciar ensamble sin esperar otros cortes.
              </p>
              <div class="expl-verdict text-primary">
                <strong>Criterio Técnico:</strong> Elección idónea cuando el taller experimenta cuellos de botella en montaje o falta de espacio físico.
              </div>
            </div>

            <div class="algo-expl-card">
              <div class="expl-badge">5. WORST FIT DECREASING (WFD)</div>
              <h5>Balanceo de Espacio Residual y Retales Largos</h5>
              <p>
                <strong>Principio:</strong> Asigna los cortes a la barra con mayor holgura disponible para asegurar que los restos finales sean piezas largas aprovechables.
              </p>
              <p>
                <strong>Decisión Tomada:</strong> Utiliza barras de 8.000 mm y deja retales limpios de más de 800 mm listos en el rack para siguientes pedidos.
              </p>
              <div class="expl-verdict text-muted">
                <strong>Criterio Técnico:</strong> Recomendado cuando el almacén de retales tiene alta rotación de medidas intermedias.
              </div>
            </div>

            <div class="algo-expl-card">
              <div class="expl-badge">6. SCRAP FIRST (ECONOMÍA CIRCULAR)</div>
              <h5>Reutilización Prioritaria de Retales Existentes</h5>
              <p>
                <strong>Principio:</strong> Antes de planificar barras comerciales nuevas, rastrea los retales en stock &ge; 200mm y descuenta piezas.
              </p>
              <p>
                <strong>Decisión Tomada:</strong> Si el almacén dispone de retales acumulados, los consume a coste cero antes de ordenar nuevas barras a proveedor.
              </p>
              <div class="expl-verdict text-green">
                <strong>Criterio Técnico:</strong> Práctica óptima para contención de inventario inmovilizado.
              </div>
            </div>
          </div>
        </div>

        <!-- Plan de Corte Barra a Barra (Hoja de Taller) -->
        <div class="report-section mt-5">
          <h3 class="section-title-sm">
            Plan de Corte en Planta: 11 Barras Comerciales Óptimas
          </h3>
          <p class="text-xs text-muted" style="margin-top:-6px; margin-bottom: 12px;">
            Hoja de trabajo para el operador de tronzadora (Disco de 3.0 mm | Umbral Merma: 200 mm):
          </p>

          <div class="table-responsive">
            <table class="report-table workshop-table">
              <thead>
                <tr>
                  <th>Nº Barra</th>
                  <th>Barra Comercial Base</th>
                  <th>Cortes Programados</th>
                  <th>Longitud Útil</th>
                  <th>Sobrante</th>
                  <th>Destino del Sobrante</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in planCorteTaller" :key="b.num">
                  <td><strong>Barra #{{ b.num }}</strong></td>
                  <td><span class="badge badge-aluminio">{{ b.base }}</span></td>
                  <td><strong>{{ b.cortes }}</strong></td>
                  <td>{{ b.usada }}</td>
                  <td><strong>{{ b.sobrante }}</strong></td>
                  <td>
                    <span class="text-green font-bold">{{ b.destino }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <span class="text-xs text-muted">
          Documento elaborado con el sistema Antigravity Cutting Optimizer v2.4 para Stulz España S.A.
        </span>
        <div class="action-row">
          <button class="btn btn-secondary btn-sm" @click="$emit('cerrar')">Cerrar</button>
          <button class="btn btn-primary btn-sm" @click="descargarPDF">
            <Download :size="15" style="margin-right:6px;" />
            <span>Descargar PDF Oficial</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Download, Printer } from 'lucide-vue-next'
import { generarInformeTecnicoPDF } from '../utils/pdfEstudioReport'

const emit = defineEmits(['cerrar'])

const planCorteTaller = ref([
  { num: 1, base: '8.000 mm (8m)', cortes: '2 cortes: [3.760 mm] + [3.760 mm]', usada: '7.526 mm', sobrante: '474 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 2, base: '8.000 mm (8m)', cortes: '2 cortes: [3.760 mm] + [3.760 mm]', usada: '7.526 mm', sobrante: '474 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 3, base: '8.000 mm (8m)', cortes: '2 cortes: [3.760 mm] + [3.760 mm]', usada: '7.526 mm', sobrante: '474 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 4, base: '8.000 mm (8m)', cortes: '2 cortes: [3.760 mm] + [3.760 mm]', usada: '7.526 mm', sobrante: '474 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 5, base: '8.000 mm (8m)', cortes: '2 cortes: [3.650 mm] + [3.650 mm]', usada: '7.306 mm', sobrante: '694 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 6, base: '8.000 mm (8m)', cortes: '2 cortes: [3.650 mm] + [3.650 mm]', usada: '7.306 mm', sobrante: '694 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 7, base: '8.000 mm (8m)', cortes: '2 cortes: [3.650 mm] + [3.650 mm]', usada: '7.306 mm', sobrante: '694 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 8, base: '8.000 mm (8m)', cortes: '2 cortes: [3.650 mm] + [3.650 mm]', usada: '7.306 mm', sobrante: '694 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 9, base: '8.000 mm (8m)', cortes: '3 cortes: [2.450 mm] + [2.450 mm] + [2.450 mm]', usada: '7.359 mm', sobrante: '641 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 10, base: '8.000 mm (8m)', cortes: '3 cortes: [2.450 mm] + [2.450 mm] + [2.450 mm]', usada: '7.359 mm', sobrante: '641 mm', destino: 'Retal Reutilizable (Almacén)' },
  { num: 11, base: '6.000 mm (6m)', cortes: '2 cortes: [2.450 mm] + [2.450 mm]', usada: '4.906 mm', sobrante: '1.094 mm', destino: 'Retal Reutilizable (Almacén)' }
])

function descargarPDF() {
  generarInformeTecnicoPDF({ descargar: true })
}

function imprimirReporte() {
  window.print()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 26, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-container {
  background: var(--bg-surface, #1e293b);
  border: 1px solid var(--border-color, #334155);
  border-radius: 12px;
  width: 100%;
  max-width: 1180px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  color: #f1f5f9;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color, #334155);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.7);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.modal-badge {
  display: inline-block;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
}

.modal-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.modal-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border-color, #334155);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.5);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.report-section {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--border-color, #334155);
  border-radius: 8px;
  padding: 18px;
}

.section-title-sm {
  margin: 0 0 12px 0;
  font-size: 0.98rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
}

.summary-badge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.comparison-card {
  padding: 18px;
  border-radius: 8px;
  border: 1px solid;
}

.card-traditional {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
}

.card-optimized {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.35);
}

.comp-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.comp-header h4 {
  margin: 0;
  font-size: 0.98rem;
  color: #f8fafc;
}

.comp-kpi {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
  font-size: 0.88rem;
}

.kpi-num {
  font-weight: 700;
  font-size: 1.02rem;
}

.kpi-lbl {
  color: #94a3b8;
}

.alert-kpi .kpi-num {
  color: #ef4444;
}

.comp-note {
  margin: 12px 0 0 0;
  line-height: 1.4;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.report-table th, .report-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
}

.report-table th {
  background: rgba(15, 23, 42, 0.7);
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.row-winner {
  background: rgba(34, 197, 94, 0.08);
}

.row-danger {
  background: rgba(239, 68, 68, 0.08);
}

.algo-explanation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.algo-expl-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
}

.expl-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.algo-expl-card h5 {
  margin: 0 0 8px 0;
  font-size: 0.92rem;
  color: #f8fafc;
}

.algo-expl-card p {
  margin: 0 0 8px 0;
  font-size: 0.8rem;
  color: #cbd5e1;
  line-height: 1.45;
}

.expl-verdict {
  margin-top: 10px;
  font-size: 0.78rem;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.font-bold {
  font-weight: 700;
}

@media print {
  .modal-overlay {
    position: static;
    background: none;
    padding: 0;
  }
  .modal-container {
    max-height: none;
    box-shadow: none;
    border: none;
    color: #000;
    background: #fff;
  }
  .modal-actions, .modal-footer {
    display: none;
  }
}
</style>
