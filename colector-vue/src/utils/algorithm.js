/**
 * Algoritmo de Corte 1D (Cutting Stock Problem)
 * Utiliza First Fit Decreasing (FFD) modificado para priorizar retales.
 */

export const calculateCuts = (workOrders, currentInventory, config) => {
  const { barLength, sawKerf, minScrapLength } = config;

  // Agrupar órdenes por Material y Medida
  const groups = {};
  workOrders.forEach(order => {
    const key = `${order.material}|${order.tubSize}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(order);
  });

  const results = [];
  let barCounter = 1;

  // Clonar inventario para no mutarlo directamente aquí
  const availableScrap = [...currentInventory];

  // Función para buscar el mejor retal (Best Fit)
  const findBestScrap = (lengthNeeded, material, tubSize) => {
    let bestIdx = -1;
    let minLeftover = Infinity;

    for (let i = 0; i < availableScrap.length; i++) {
      const scrap = availableScrap[i];
      if (scrap.material === material && scrap.tubSize === tubSize && scrap.length >= lengthNeeded) {
        const leftover = scrap.length - lengthNeeded;
        if (leftover < minLeftover) {
          minLeftover = leftover;
          bestIdx = i;
        }
      }
    }

    if (bestIdx !== -1) {
      const selected = availableScrap.splice(bestIdx, 1)[0];
      return selected;
    }
    return null;
  };

  for (const key in groups) {
    // 1. Ordenar cortes de mayor a menor (First Fit Decreasing)
    const cuts = groups[key].sort((a, b) => b.length - a.length);
    const [material, tubSize] = key.split('|');

    // Barras en uso para este grupo
    const activeBars = [];

    cuts.forEach(cut => {
      // La longitud real que consumimos incluye la merma de la sierra
      const requiredLength = cut.length + sawKerf;

      // a. Buscar primero si hay un retal en el inventario general que sirva
      const validScrap = findBestScrap(requiredLength, material, tubSize);
      
      if (validScrap) {
        // Usamos un retal del rack
        const newActiveScrap = {
          id: `USED-${validScrap.id}`,
          originalScrapId: validScrap.id,
          isNew: false,
          material,
          tubSize,
          originalLength: validScrap.length,
          remaining: validScrap.length - requiredLength,
          cuts: [cut]
        };
        activeBars.push(newActiveScrap);
        return; // Corte asignado
      }

      // b. Buscar en las barras activas de este grupo (Best Fit)
      let bestActiveIdx = -1;
      let minLeftover = Infinity;
      for (let i = 0; i < activeBars.length; i++) {
        const bar = activeBars[i];
        if (bar.remaining >= requiredLength) {
          const leftover = bar.remaining - requiredLength;
          if (leftover < minLeftover) {
            minLeftover = leftover;
            bestActiveIdx = i;
          }
        }
      }

      if (bestActiveIdx !== -1) {
        // Asignar a la mejor barra activa
        activeBars[bestActiveIdx].cuts.push(cut);
        activeBars[bestActiveIdx].remaining -= requiredLength;
        return;
      }

      // c. Si no hay retal ni barra activa que sirva, abrir una barra nueva
      const newBar = {
        id: `BAR-${String(barCounter++).padStart(3, '0')}`,
        isNew: true,
        material,
        tubSize,
        originalLength: barLength,
        remaining: barLength - requiredLength,
        cuts: [cut]
      };
      activeBars.push(newBar);
    });

    // Guardar las barras procesadas de este grupo en el resultado final
    activeBars.forEach(bar => {
      // Comprobar si el sobrante es aprovechable
      bar.newScrapGenerated = bar.remaining >= minScrapLength;
      results.push(bar);
    });
  }

  return {
    barsUsed: results,
    // Devolvemos qué retales han sobrado (para actualizar el rack si es necesario)
    leftoverInventory: availableScrap
  };
};
