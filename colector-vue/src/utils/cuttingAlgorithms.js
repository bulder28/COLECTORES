/**
 * cuttingAlgorithms.js - Suite Industrial de Algoritmos de Corte 1D (Cutting Stock Problem)
 * Diseñado para Colectores de Cobre/Hierro y Perfiles Estructurales de Aluminio Stulz.
 * 
 * Motores disponibles:
 * 1. BFD (Best Fit Decreasing) - Mínimo Desperdicio Inmediato
 * 2. Knapsack Dinámico (Programación Dinámica 0-1) - Ajuste Matemático Óptimo
 * 3. Algoritmo Genético (AG / Metaheurística Evolutiva) - Búsqueda Global
 * 4. Kitting Lean (Ingeniería de Procesos) - Cero WIP / Flujo por Batería Padre
 * 5. Scrap First + BFD - Prioridad de Reutilización de Retales de Almacén
 * 6. FFD (First Fit Decreasing) - Clásico Industrial de Máxima Velocidad
 * 7. WFD (Worst Fit Decreasing) - Balanceo de Espacio y Restos Reutilizables
 */

/**
 * Normaliza y clona una lista de cortes de forma segura
 */
function clonarCortes(cortes) {
  return cortes.map(c => ({
    id: c.of || c.id || Math.random().toString(36).substring(7),
    of: c.of || c.numero || '',
    norden_padre: c.norden_padre || 'Sin Batería',
    longitud: Number(c.longitud) || 0,
    tipo: c.tipo || 'perfil',
    categoria: c.categoria || 'perfil',
    prioridad: c.prioridad || 'Normal',
    medida: c.medida || '',
    material: c.material || ''
  }))
}

/**
 * Decodificador Voraz a partir de una secuencia de cortes
 * Utilizado por el Algoritmo Genético y optimizadores de permutación
 */
function decodificarSecuencia(cortesOrdenados, barLengths, kerf) {
  const bars = []
  const sortedBars = [...barLengths].sort((a, b) => b.length - a.length)
  const defaultBarLength = sortedBars[0].length

  for (const corte of cortesOrdenados) {
    let placed = false
    const espacioNecesario = corte.longitud + kerf

    // Buscar la barra existente que deje menor hueco (Best Fit)
    let bestBarIdx = -1
    let minResidual = Infinity

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      const residual = bar.originalLength - bar.used - espacioNecesario
      if (residual >= 0 && residual < minResidual) {
        minResidual = residual
        bestBarIdx = i
      }
    }

    if (bestBarIdx !== -1) {
      bars[bestBarIdx].cuts.push(corte)
      bars[bestBarIdx].used += espacioNecesario
      placed = true
    } else {
      // Elegir la barra comercial que deje menor desperdicio
      let bestCandidate = null
      let minNewResidual = Infinity

      for (const cand of barLengths) {
        const residual = cand.length - espacioNecesario
        if (residual >= 0 && residual < minNewResidual) {
          minNewResidual = residual
          bestCandidate = cand
        }
      }

      const chosenLength = bestCandidate ? bestCandidate.length : defaultBarLength

      bars.push({
        originalLength: chosenLength,
        used: espacioNecesario,
        cost: bestCandidate?.cost || 0,
        cuts: [corte]
      })
    }
  }

  return bars
}

/**
 * 1. BEST FIT DECREASING (BFD) - RECOMENDADO MÍNIMO DESPERDICIO
 * Ordena de mayor a menor y asigna cada pieza a la barra existente con menor residuo.
 */
export function solveBFD(cortesInput, barLengths, kerf, config = {}) {
  const cortes = clonarCortes(cortesInput)
  cortes.sort((a, b) => b.longitud - a.longitud)

  const bars = decodificarSecuencia(cortes, barLengths, kerf)
  return formatResult('Best Fit Decreasing (BFD)', 'bfd', bars, kerf, config)
}

/**
 * 2. KNAPSACK DINÁMICO (PROGRAMACIÓN DINÁMICA 0-1 SUBSET SUM)
 * Resuelve para cada barra el subconjunto de piezas cuya suma maximiza el llenado
 * acercándose al 100% de ocupación (desperdicio milimétrico 0).
 */
export function solveKnapsack(cortesInput, barLengths, kerf, config = {}) {
  let pendientes = clonarCortes(cortesInput)
  pendientes.sort((a, b) => b.longitud - a.longitud)

  const sortedBarLengths = [...barLengths].sort((a, b) => b.length - a.length)
  const bars = []

  while (pendientes.length > 0) {
    let bestSubset = null
    let bestBar = sortedBarLengths[0]
    let bestWaste = Infinity

    // Probar contra cada barra comercial disponible
    for (const cand of sortedBarLengths) {
      const capacity = cand.length
      const n = pendientes.length

      // Si la pieza mayor no cabe ni en toda la barra sola, saltar
      if (pendientes[0].longitud + kerf > capacity) continue

      // Programación Dinámica para Subset Sum acotado
      // dp[w] = array de índices que logran llenar 'w' milímetros
      const dp = new Map()
      dp.set(0, [])

      for (let i = 0; i < n; i++) {
        const itemLen = pendientes[i].longitud + kerf
        if (itemLen > capacity) continue

        const entries = Array.from(dp.entries())
        for (const [w, indices] of entries) {
          const newW = w + itemLen
          if (newW <= capacity && !dp.has(newW)) {
            dp.set(newW, [...indices, i])
          }
        }
        // Si alcanzamos llenado perfecto (desperdicio <= kerf), terminar búsqueda anticipada
        if (dp.has(capacity)) break
      }

      // Encontrar el mayor peso alcanzable <= capacity
      let maxWeight = 0
      for (const w of dp.keys()) {
        if (w > maxWeight) maxWeight = w
      }

      const waste = capacity - maxWeight
      const wasteRatio = waste / capacity

      if (wasteRatio < bestWaste) {
        bestWaste = wasteRatio
        bestBar = cand
        bestSubset = {
          indices: dp.get(maxWeight) || [0],
          capacity: cand.length,
          cost: cand.cost || 0
        }
      }
    }

    if (bestSubset && bestSubset.indices.length > 0) {
      const chosenIndices = new Set(bestSubset.indices)
      const cutsForBar = []
      let used = 0

      for (let i = 0; i < pendientes.length; i++) {
        if (chosenIndices.has(i)) {
          cutsForBar.push(pendientes[i])
          used += pendientes[i].longitud + kerf
        }
      }

      bars.push({
        originalLength: bestSubset.capacity,
        used,
        cost: bestSubset.cost,
        cuts: cutsForBar
      })

      // Eliminar elementos seleccionados de los pendientes
      pendientes = pendientes.filter((_, idx) => !chosenIndices.has(idx))
    } else {
      // Fallback voraz para la pieza mayor
      const item = pendientes.shift()
      bars.push({
        originalLength: sortedBarLengths[0].length,
        used: item.longitud + kerf,
        cost: sortedBarLengths[0].cost || 0,
        cuts: [item]
      })
    }
  }

  return formatResult('Knapsack Dinámico (Mochila Exacta)', 'knapsack', bars, kerf, config)
}

/**
 * 3. ALGORITMO GENÉTICO (METAHEURÍSTICA EVOLUTIVA)
 * Simula poblaciones cromosómicas de patrones de corte, aplicando cruce OX y mutaciones
 * para escapar de óptimos locales y encontrar la permutación con menor desecho global.
 */
export function solveGeneticAlgorithm(cortesInput, barLengths, kerf, config = {}) {
  const cortes = clonarCortes(cortesInput)
  if (cortes.length <= 3) {
    return solveBFD(cortesInput, barLengths, kerf)
  }

  const POP_SIZE = config.popSize || 24
  const GENERATIONS = config.generations || 35
  const MUTATION_RATE = 0.25

  // Función de fitness: penaliza barras extra y desperdicio total
  function evaluateFitness(chromosome) {
    const sequence = chromosome.map(idx => cortes[idx])
    const bars = decodificarSecuencia(sequence, barLengths, kerf)
    
    let totalWaste = 0
    bars.forEach(b => {
      totalWaste += Math.max(0, b.originalLength - b.used)
    })

    // Fitness más alto = mejor (menos barras y menos desecho)
    const score = -(bars.length * 100000 + totalWaste)
    return { score, bars }
  }

  // Inicializar población
  const population = []

  // Individuo 1 (Élite inicial): Orden descendente por longitud (heurística voraz)
  const sortedIndices = cortes
    .map((c, i) => ({ len: c.longitud, i }))
    .sort((a, b) => b.len - a.len)
    .map(x => x.i)
  population.push(sortedIndices)

  // Individuo 2: Orden por prioridad descendente
  const priorityIndices = cortes
    .map((c, i) => ({ prio: c.prioridad === 'Alta' ? 3 : c.prioridad === 'Normal' ? 2 : 1, i }))
    .sort((a, b) => b.prio - a.prio)
    .map(x => x.i)
  population.push(priorityIndices)

  // Resto de individuos: permutaciones aleatorias
  const baseArray = cortes.map((_, i) => i)
  while (population.length < POP_SIZE) {
    const shuffled = [...baseArray]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    population.push(shuffled)
  }

  let bestIndividual = population[0]
  let bestEval = evaluateFitness(bestIndividual)

  // Bucle evolutivo de generaciones
  for (let gen = 0; gen < GENERATIONS; gen++) {
    const scoredPop = population.map(ind => ({
      individual: ind,
      eval: evaluateFitness(ind)
    }))

    // Ordenar de mejor a peor
    scoredPop.sort((a, b) => b.eval.score - a.eval.score)

    if (scoredPop[0].eval.score > bestEval.score) {
      bestEval = scoredPop[0].eval
      bestIndividual = [...scoredPop[0].individual]
    }

    const nextGen = []
    // Elitismo: conservar los mejores 2 individuos intactos
    nextGen.push(scoredPop[0].individual)
    nextGen.push(scoredPop[1].individual)

    // Selección por torneo y cruce Order Crossover (OX)
    while (nextGen.length < POP_SIZE) {
      const parentA = tournamentSelect(scoredPop, 3)
      const parentB = tournamentSelect(scoredPop, 3)

      let child = orderCrossover(parentA, parentB)

      // Mutación por intercambio de 2 piezas
      if (Math.random() < MUTATION_RATE) {
        const i = Math.floor(Math.random() * child.length)
        const j = Math.floor(Math.random() * child.length)
        const tmp = child[i]
        child[i] = child[j]
        child[j] = tmp
      }

      nextGen.push(child)
    }

    population.splice(0, population.length, ...nextGen)
  }

  return formatResult('Algoritmo Genético (Metaheurística Evolutiva)', 'genetic', bestEval.bars, kerf, config)
}

/**
 * Helper: Selección por torneo para el Algoritmo Genético
 */
function tournamentSelect(scoredPop, k = 3) {
  let best = scoredPop[Math.floor(Math.random() * scoredPop.length)]
  for (let i = 1; i < k; i++) {
    const cand = scoredPop[Math.floor(Math.random() * scoredPop.length)]
    if (cand.eval.score > best.eval.score) {
      best = cand
    }
  }
  return best.individual
}

/**
 * Helper: Cruce de Orden (Order Crossover - OX)
 * Garantiza que cada pieza aparece exactamente una vez sin duplicados
 */
function orderCrossover(parentA, parentB) {
  const n = parentA.length
  const p1 = Math.floor(Math.random() * n)
  const p2 = Math.floor(Math.random() * n)
  const start = Math.min(p1, p2)
  const end = Math.max(p1, p2)

  const child = new Array(n).fill(-1)
  const taken = new Set()

  for (let i = start; i <= end; i++) {
    child[i] = parentA[i]
    taken.add(parentA[i])
  }

  let curChildIdx = (end + 1) % n
  let curParentBIdx = (end + 1) % n

  while (taken.size < n) {
    const gene = parentB[curParentBIdx]
    if (!taken.has(gene)) {
      child[curChildIdx] = gene
      taken.add(gene)
      curChildIdx = (curChildIdx + 1) % n
    }
    curParentBIdx = (curParentBIdx + 1) % n
  }

  return child
}

/**
 * 4. KITTING LEAN (PRIORIDAD POR BATERÍA / CERO WIP)
 * Agrupa estrictamente por Batería (norden_padre) antes de cortar.
 * Corta unidades completas para montaje inmediato, eliminando cuellos de botella en planta.
 */
export function solveKittingLean(cortesInput, barLengths, kerf, config = {}) {
  const cortes = clonarCortes(cortesInput)

  // Agrupar por Batería (norden_padre)
  const mapPadres = new Map()
  for (const c of cortes) {
    const key = c.norden_padre || 'Sin Batería'
    if (!mapPadres.has(key)) mapPadres.set(key, [])
    mapPadres.get(key).push(c)
  }

  const bars = []

  // Procesar cada batería individualmente para evitar mezclar estructuras
  for (const [padre, cortesBateria] of mapPadres) {
    cortesBateria.sort((a, b) => b.longitud - a.longitud)

    for (const corte of cortesBateria) {
      let placed = false

      // Buscar si cabe en barras que ya pertenezcan a esta misma batería
      for (const bar of bars) {
        if (bar.padrePrincipal === padre) {
          const espacioNecesario = corte.longitud + kerf
          if (bar.originalLength - bar.used >= espacioNecesario) {
            bar.cuts.push(corte)
            bar.used += espacioNecesario
            placed = true
            break
          }
        }
      }

      if (!placed) {
        // Buscar la mejor barra comercial para las piezas de esta batería
        const sortedCandidates = [...barLengths].sort((a, b) => a.length - b.length)
        const fitting = sortedCandidates.find(b => b.length >= corte.longitud + kerf) || sortedCandidates[sortedCandidates.length - 1]
        const chosenLength = fitting ? fitting.length : 6000

        bars.push({
          originalLength: chosenLength,
          used: corte.longitud + kerf,
          padrePrincipal: padre,
          cost: fitting?.cost || 0,
          cuts: [corte]
        })
      }
    }
  }

  return formatResult('Kitting Lean (Cero Cuellos de Botella)', 'kitting', bars, kerf, config)
}

/**
 * 5. SCRAP FIRST (REUTILIZACIÓN DE RETALES DE ALMACÉN PRIMERO)
 * Agota primero los retales útiles (>= 500 mm) registrados en el almacén de stock.
 * Solo abre barras comerciales nuevas cuando no caben en ningún retal existente.
 */
export function solveScrapFirst(cortesInput, barLengths, kerf, config = {}) {
  const cortes = clonarCortes(cortesInput)
  cortes.sort((a, b) => b.longitud - a.longitud)

  // Retales disponibles en el almacén (si no se pasan, se toma lista de stock o demo)
  const retalesDisponibles = config.retales && config.retales.length > 0 
    ? config.retales.map(r => ({
        id: r.id || `retal-${Math.random().toString(36).substr(2, 5)}`,
        originalLength: Number(r.longitud) || 0,
        used: 0,
        isRetalExistente: true,
        cuts: []
      }))
    : []

  const bars = []
  const cortesSinRetal = []

  // Paso 1: Intentar colocar piezas en retales existentes mediante Best Fit
  for (const corte of cortes) {
    let placedInRetal = false
    let bestRetalIdx = -1
    let minResidual = Infinity
    const espacioNecesario = corte.longitud + kerf

    for (let i = 0; i < retalesDisponibles.length; i++) {
      const retal = retalesDisponibles[i]
      const residual = retal.originalLength - retal.used - espacioNecesario
      if (residual >= 0 && residual < minResidual) {
        minResidual = residual
        bestRetalIdx = i
      }
    }

    if (bestRetalIdx !== -1) {
      retalesDisponibles[bestRetalIdx].cuts.push(corte)
      retalesDisponibles[bestRetalIdx].used += espacioNecesario
      placedInRetal = true
    }

    if (!placedInRetal) {
      cortesSinRetal.push(corte)
    }
  }

  // Añadir retales que fueron efectivamente utilizados
  for (const retal of retalesDisponibles) {
    if (retal.cuts.length > 0) {
      bars.push(retal)
    }
  }

  // Paso 2: Las piezas que no cupieron en retales se resuelven con BFD en barras nuevas
  if (cortesSinRetal.length > 0) {
    const barrasNuevas = decodificarSecuencia(cortesSinRetal, barLengths, kerf)
    bars.push(...barrasNuevas)
  }

  return formatResult('Scrap First (Reutilización de Retales de Stock)', 'scrap', bars, kerf, config)
}

/**
 * 6. FIRST FIT DECREASING (FFD) - ESTÁNDAR CLÁSICO
 * Ordena de mayor a menor y coloca cada pieza en la primera barra donde quepa.
 */
export function solveFFD(cortesInput, barLengths, kerf, config = {}) {
  const cortes = clonarCortes(cortesInput)
  cortes.sort((a, b) => b.longitud - a.longitud)

  const defaultBarLength = Math.max(...barLengths.map(b => b.length))
  const bars = []

  for (const corte of cortes) {
    let placed = false
    const espacioNecesario = corte.longitud + kerf

    for (const bar of bars) {
      if (bar.originalLength - bar.used >= espacioNecesario) {
        bar.cuts.push(corte)
        bar.used += espacioNecesario
        placed = true
        break
      }
    }

    if (!placed) {
      const sortedCandidates = [...barLengths].sort((a, b) => a.length - b.length)
      const fitting = sortedCandidates.find(b => b.length >= espacioNecesario) || sortedCandidates[sortedCandidates.length - 1]
      const chosenLength = fitting ? fitting.length : defaultBarLength

      bars.push({
        originalLength: chosenLength,
        used: espacioNecesario,
        cost: fitting?.cost || 0,
        cuts: [corte]
      })
    }
  }

  return formatResult('First Fit Decreasing (FFD)', 'ffd', bars, kerf, config)
}

/**
 * 7. WORST FIT DECREASING (WFD) - BALANCEO Y RETALES GRANDES
 * Coloca las piezas en la barra con mayor espacio restante para dejar retales homogéneos.
 */
export function solveWFD(cortesInput, barLengths, kerf, config = {}) {
  const cortes = clonarCortes(cortesInput)
  cortes.sort((a, b) => b.longitud - a.longitud)

  const bars = []

  for (const corte of cortes) {
    let worstBarIndex = -1
    let maxResidual = -1
    const espacioNecesario = corte.longitud + kerf

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      const residual = bar.originalLength - bar.used - espacioNecesario
      if (residual >= 0 && residual > maxResidual) {
        maxResidual = residual
        worstBarIndex = i
      }
    }

    if (worstBarIndex !== -1) {
      bars[worstBarIndex].cuts.push(corte)
      bars[worstBarIndex].used += espacioNecesario
    } else {
      const maxCandidate = Math.max(...barLengths.map(b => b.length))
      bars.push({
        originalLength: maxCandidate,
        used: espacioNecesario,
        cuts: [corte]
      })
    }
  }

  return formatResult('Worst Fit (Balanceo de Espacio)', 'wfd', bars, kerf, config)
}

/**
 * 8. GOOGLE OR-TOOLS CP-SAT (PYTHON SOLVER)
 * Conecta con el microservicio Python local (http://localhost:8000/optimize).
 * Si el servidor Python no está encendido, realiza fallback transparente a Knapsack Dinámico.
 */
export async function solveGoogleORTools(cortesInput, barLengths, kerf, config = {}) {
  const retalMinRaw = config.retalMinimo ?? config.retal_minimo
  const retalMin = (retalMinRaw !== undefined && retalMinRaw !== null && retalMinRaw !== '')
    ? Number(retalMinRaw)
    : 500
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)

    const resp = await fetch('http://localhost:8000/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cortes: cortesInput,
        bar_lengths: barLengths,
        kerf: kerf,
        retal_minimo: retalMin,
        max_seconds: 3.0
      }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (resp.ok) {
      const data = await resp.json()
      if (!data.error && data.tubos) {
        return data
      }
    }
  } catch (err) {
    // Servidor Python no activo o timeout, fallback a Knapsack Dinámico nativo
  }

  const fallback = solveKnapsack(cortesInput, barLengths, kerf, config)
  fallback.algoritmo = 'Google OR-Tools (Simulación Local JS)'
  fallback.idAlgoritmo = 'ortools'
  return fallback
}

/**
 * Catálogo descriptivo de los algoritmos para la UI
 */
export const CATALOGO_ALGORITMOS = [
  {
    id: 'bfd',
    nombre: 'Best Fit Decreasing (BFD)',
    categoria: 'Heurística Voraz 1D',
    codigo: 'BFD',
    badge: 'Aprovechamiento Máximo',
    pro: 'Aprovechamiento máximo del material comercial',
    descripcion: 'Empaqueta cada pieza en la barra con menor espacio sobrante. Elige la medida comercial óptima para minimizar la merma.',
    idealPara: 'Producción estándar con objetivo de reducción de merma en lotes uniformes.'
  },
  {
    id: 'ortools',
    nombre: 'Google OR-Tools (Python CP-SAT)',
    categoria: 'Programación por Restricciones / MIP',
    codigo: 'CP-SAT',
    badge: 'Solver Exacto Global',
    pro: 'Demostración de óptimo global matemático',
    descripcion: 'Ejecuta el solver CP-SAT de Google OR-Tools en Python. Modela el problema de corte como programación de restricciones exacta con poda Branch-and-Bound.',
    idealPara: 'Máxima optimización matemática industrial y verificación formal de pedidos.'
  },
  {
    id: 'knapsack',
    nombre: 'Knapsack Dinámico',
    categoria: 'Programación Dinámica',
    codigo: 'DP-01',
    badge: 'Ajuste Combinatorio 0-1',
    pro: 'Combinaciones milimétricas exactas',
    descripcion: 'Calcula particiones matemáticas (mochila) para llenar las barras al 100% de su capacidad sin dejar residuos inútiles.',
    idealPara: 'Series de piezas variadas donde se busca desperdicio milimétrico mínimo.'
  },
  {
    id: 'genetic',
    nombre: 'Algoritmo Genético (AG)',
    categoria: 'Metaheurística Evolutiva',
    codigo: 'GA-OX',
    badge: 'Optimización Combinatoria',
    pro: 'Escapa de óptimos locales en lotes grandes',
    descripcion: 'Simula generaciones cromosómicas con cruce genético OX y mutaciones para explorar patrones de corte combinatorios complejos.',
    idealPara: 'Grandes lotes de pedidos (>50 piezas) donde las reglas voraces se estancan.'
  },
  {
    id: 'kitting',
    nombre: 'Kitting Lean Manufacturing',
    categoria: 'Ingeniería de Procesos',
    codigo: 'LEAN',
    badge: 'Flujo Continuo (Cero WIP)',
    pro: 'Flujo continuo sin piezas acumuladas en planta',
    descripcion: 'Agrupa estrictamente por Batería/Estructura Padre. Todas las piezas de una unidad se cortan juntas para montaje inmediato.',
    idealPara: 'Talleres saturados con problemas de Work-In-Progress (WIP) y falta de espacio.'
  },
  {
    id: 'scrap',
    nombre: 'Scrap First (Retales Primero)',
    categoria: 'Economía Circular',
    codigo: 'STOCK',
    badge: 'Consumo de Stock en Rack',
    pro: 'Reduce inventario inmovilizado en stock',
    descripcion: 'Escanea los retales existentes en stock (>= umbral de merma) y los gasta primero antes de cortar cualquier barra comercial nueva.',
    idealPara: 'Limpieza periódica del almacén de retales y contención de compras a proveedores.'
  },
  {
    id: 'ffd',
    nombre: 'First Fit Decreasing (FFD)',
    categoria: 'Industrial Clásico',
    codigo: 'FFD',
    badge: 'Estándar Johnson (1974)',
    pro: 'Velocidad de ejecución y sencillez de operario',
    descripcion: 'El estándar clásico de bin packing. Coloca las piezas grandes primero en la primera barra donde quepan.',
    idealPara: 'Cálculos instantáneos en máquina de corte para pedidos urgentes.'
  },
  {
    id: 'wfd',
    nombre: 'Worst Fit Decreasing (WFD)',
    categoria: 'Balanceo de Restos',
    codigo: 'WFD',
    badge: 'Balanceo de Retales',
    pro: 'Deja restos grandes en vez de viruta inservible',
    descripcion: 'Reparte las piezas dejando el mayor sobrante posible en cada barra, generando retales útiles para otros proyectos.',
    idealPara: 'Cuando se prefiere tener un retal largo aprovechable a varios sobrantes pequeños.'
  }
]

/**
 * Formatea y calcula estadísticas unificadas del resultado
 */
function formatResult(nombre, id, bars, kerf, config = {}) {
  const retalMinimoRaw = config.retalMinimo ?? config.retal_minimo
  const retalMinimo = (retalMinimoRaw !== undefined && retalMinimoRaw !== null && retalMinimoRaw !== '')
    ? Number(retalMinimoRaw)
    : 500

  // Si retalMinimo <= 0: el usuario indica que NO se aprovecha ningún retal (todo es merma directa)
  const noAprovecharRetales = (retalMinimo <= 0)

  let totalBrutoMM = 0
  let totalDesperdicioMM = 0
  let totalChatarraMM = 0
  let totalRetalesGeneradosMM = 0
  let retalesGeneradosCount = 0
  let tubosMezclados = 0
  let totalCortes = 0
  let totalUtilesMM = 0
  let costeTotal = 0
  let retalesUsados = 0
  const desgloseBarras = {}

  let barId = 1
  const formattedBars = bars.map(b => {
    totalBrutoMM += b.originalLength
    const desp = Math.max(0, b.originalLength - b.used)
    totalDesperdicioMM += desp
    totalCortes += b.cuts.length
    if (b.cost) costeTotal += b.cost
    if (b.isRetalExistente) retalesUsados++

    desgloseBarras[b.originalLength] = (desgloseBarras[b.originalLength] || 0) + 1

    const uniqueP = new Set(b.cuts.map(c => c.norden_padre).filter(p => p && p !== 'Sin Batería'))
    if (uniqueP.size > 1) tubosMezclados++

    for (const c of b.cuts) {
      totalUtilesMM += c.longitud
    }

    // Clasificación de residuo:
    // Si retalMinimo <= 0: NO se aprovecha ningún retal -> todo sobrante es merma/chatarra
    // Si retalMinimo > 0: sobrantes >= retalMinimo se guardan en rack; < retalMinimo son merma
    const esRetalAprovechable = (!noAprovecharRetales) && (desp >= retalMinimo)
    const esChatarra = (desp > 0) && (noAprovecharRetales || desp < retalMinimo)
    if (desp > 0) {
      if (esRetalAprovechable) {
        totalRetalesGeneradosMM += desp
        retalesGeneradosCount++
      } else {
        totalChatarraMM += desp
      }
    }

    return {
      id: `${barId++}`,
      isNew: !b.isRetalExistente,
      isRetal: !!b.isRetalExistente,
      retalId: b.retalId || null,
      originalLength: b.originalLength,
      used: b.used,
      desperdicio: desp,
      remaining: desp,
      retalMinimo,
      newScrapGenerated: esRetalAprovechable, // Usado por BarVisualizer: true = retal reutilizable
      esRetalAprovechable,
      esChatarra,
      cuts: b.cuts.map(c => ({
        length: c.longitud,
        orderId: c.of,
        norden_padre: c.norden_padre
      }))
    }
  })

  const pctDesperdicio = totalBrutoMM > 0 
    ? ((totalDesperdicioMM / totalBrutoMM) * 100).toFixed(1) 
    : '0.0'
  const pctChatarra = totalBrutoMM > 0
    ? ((totalChatarraMM / totalBrutoMM) * 100).toFixed(1)
    : '0.0'
  const pctRetalesGenerados = totalBrutoMM > 0
    ? ((totalRetalesGeneradosMM / totalBrutoMM) * 100).toFixed(1)
    : '0.0'

  return {
    algoritmo: nombre,
    idAlgoritmo: id,
    tubos: formattedBars,
    totalTubos: formattedBars.length,
    totalCortes,
    totalMetrosUtiles: (totalUtilesMM / 1000).toFixed(2),
    totalMetrosBrutos: (totalBrutoMM / 1000).toFixed(2),
    totalMetrosBrutosMM: totalBrutoMM,
    totalDesperdicio: totalDesperdicioMM,
    totalDesperdicioM: (totalDesperdicioMM / 1000).toFixed(2),
    porcentajeDesperdicio: pctDesperdicio,
    // Métricas del umbral de corte
    retalMinimo,
    totalChatarraMM,
    totalChatarraM: (totalChatarraMM / 1000).toFixed(2),
    porcentajeChatarra: pctChatarra,
    totalRetalesGeneradosMM,
    totalRetalesGeneradosM: (totalRetalesGeneradosMM / 1000).toFixed(2),
    porcentajeRetalesGenerados: pctRetalesGenerados,
    retalesGeneradosCount,
    tubosMezclados,
    retalesUsados,
    costeTotal,
    desgloseBarras
  }
}

/**
 * BENCHMARK: Ejecuta todos los algoritmos simultáneamente y devuelve comparativa en vivo
 */
export async function runBenchmark(cortes, barLengths, kerf, config = {}) {
  const bench = []

  const runners = [
    { fn: () => solveBFD(cortes, barLengths, kerf, config) },
    { fn: () => solveGoogleORTools(cortes, barLengths, kerf, config) },
    { fn: () => solveKnapsack(cortes, barLengths, kerf, config) },
    { fn: () => solveGeneticAlgorithm(cortes, barLengths, kerf, config) },
    { fn: () => solveKittingLean(cortes, barLengths, kerf, config) },
    { fn: () => solveScrapFirst(cortes, barLengths, kerf, config) },
    { fn: () => solveFFD(cortes, barLengths, kerf, config) },
    { fn: () => solveWFD(cortes, barLengths, kerf, config) }
  ]

  for (const r of runners) {
    const t0 = performance.now()
    const res = await r.fn()
    const t1 = performance.now()
    if (!res.tiempoMs) {
      res.tiempoMs = (t1 - t0).toFixed(2)
    }
    bench.push(res)
  }

  return bench
}
