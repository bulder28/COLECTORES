// ============================================
// Optimizer Module - Cutting Stock Algorithm
// ============================================

const Optimizer = {

    /**
     * Normalize material string
     */
    normalizarMaterial(material) {
        const value = String(material || '').trim();
        if (/^\s*(cu|cobre)\s*$/i.test(value)) return 'Cobre';
        if (/^\s*(fe|hierro)\s*$/i.test(value)) return 'Hierro';
        return value || 'Cobre';
    },

    /**
     * Normalize priority string
     */
    normalizarPrioridad(priority) {
        const value = String(priority || 'Normal').trim();
        if (/^\s*(alta|high|urgente)\s*$/i.test(value)) return 'Alta';
        if (/^\s*(baja|low)\s*$/i.test(value)) return 'Baja';
        return 'Normal';
    },

    /**
     * Get CSS class for material badge
     */
    materialBadgeClass(material) {
        const key = String(material || '').toLowerCase();
        if (key.includes('cobre') || key === 'cu') return 'badge-cobre';
        if (key.includes('hierro') || key === 'fe') return 'badge-hierro';
        return 'badge-cobre';
    },

    /**
     * Get CSS class for priority badge
     */
    priorityBadgeClass(priority) {
        const key = String(priority || 'Normal').toLowerCase();
        if (key === 'alta' || key === 'high') return 'badge-alta';
        if (key === 'baja' || key === 'low') return 'badge-baja';
        return 'badge-normal';
    },

    /**
     * Main optimization function - First Fit Decreasing (FFD)
     * Groups orders by medida+material, then optimizes cuts per group
     * 
     * @param {Array} ordenes - Array of order objects
     * @param {number} stockLength - Standard tube length in mm
     * @param {number} mermaTubo - Waste per cut in mm
     * @returns {Object} Optimization results
     */
    optimizar(ordenes, stockLength = 6000, mermaTubo = 3) {
        if (!ordenes || ordenes.length === 0) {
            return { grupos: [], totalTubos: 0, totalDesperdicio: 0, totalCortes: 0 };
        }

        // Group by medida + material
        const grupos = {};
        ordenes.forEach(of => {
            // Only consider pending cuts (not yet completed)
            const pendientes = Math.max(0, (of.cantidad || 0) - (of.completedCount || 0));
            if (pendientes <= 0) return;

            const key = `${of.medida}-${this.normalizarMaterial(of.material)}`;
            if (!grupos[key]) {
                grupos[key] = {
                    medida: of.medida,
                    material: this.normalizarMaterial(of.material),
                    cortes: []
                };
            }

            for (let i = 0; i < pendientes; i++) {
                grupos[key].cortes.push({
                    of: of.numero,
                    longitud: of.longitud || 0,
                    tipo: of.tipo || 'colector',
                    prioridad: this.normalizarPrioridad(of.prioridad)
                });
            }
        });

        let totalTubos = 0;
        let totalDesperdicio = 0;
        let totalCortes = 0;
        const resultados = [];

        // Optimize each group using FFD
        for (const [key, grupo] of Object.entries(grupos)) {
            const { medida, material, cortes } = grupo;

            // Sort by priority (high first), then by length (longest first) - FFD
            const PRIORITY_ORDER = { 'Alta': 3, 'Normal': 2, 'Baja': 1 };
            cortes.sort((a, b) => {
                const pa = PRIORITY_ORDER[a.prioridad] || 2;
                const pb = PRIORITY_ORDER[b.prioridad] || 2;
                if (pb !== pa) return pb - pa;
                return b.longitud - a.longitud;
            });

            const tubos = [];

            cortes.forEach(corte => {
                let placed = false;

                // Try to fit in existing tube (First Fit)
                for (let tubo of tubos) {
                    const available = stockLength - tubo.usado - mermaTubo;
                    if (available >= corte.longitud) {
                        tubo.cortes.push(corte);
                        tubo.usado += corte.longitud + mermaTubo;
                        placed = true;
                        break;
                    }
                }

                // Create new tube if doesn't fit
                if (!placed) {
                    tubos.push({
                        cortes: [corte],
                        usado: corte.longitud + mermaTubo
                    });
                }
            });

            // Calculate waste per tube
            let desperdicioGrupo = 0;
            tubos.forEach(tubo => {
                tubo.desperdicio = stockLength - tubo.usado;
                tubo.aprovechamiento = ((tubo.usado / stockLength) * 100).toFixed(1);
                desperdicioGrupo += tubo.desperdicio;
            });

            totalTubos += tubos.length;
            totalDesperdicio += desperdicioGrupo;
            totalCortes += cortes.length;

            resultados.push({
                medida,
                material,
                tubos,
                tubosCount: tubos.length,
                desperdicio: desperdicioGrupo,
                cortesCount: cortes.length
            });
        }

        return {
            grupos: resultados,
            totalTubos,
            totalDesperdicio,
            totalCortes,
            stockLength,
            porcentajeDesperdicio: totalTubos > 0
                ? ((totalDesperdicio / (totalTubos * stockLength)) * 100).toFixed(1)
                : '0.0'
        };
    },

    /**
     * Generate HTML visualization for optimization results
     */
    renderResultados(results, stockLength) {
        if (!results || results.grupos.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">✂️</div>
                    <div class="empty-state-text">No hay cortes pendientes para optimizar</div>
                    <div class="empty-state-hint">Importa o añade órdenes de trabajo primero</div>
                </div>
            `;
        }

        let html = '';

        // Summary stats
        html += `
            <div class="stats-grid mb-6">
                <div class="stat-card teal">
                    <div class="stat-icon">🔧</div>
                    <div class="stat-value">${results.totalTubos}</div>
                    <div class="stat-label">Tubos necesarios</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-icon">✂️</div>
                    <div class="stat-value">${results.totalCortes}</div>
                    <div class="stat-label">Total cortes</div>
                </div>
                <div class="stat-card amber">
                    <div class="stat-icon">📏</div>
                    <div class="stat-value">${(results.totalDesperdicio / 1000).toFixed(2)}m</div>
                    <div class="stat-label">Desperdicio total</div>
                </div>
                <div class="stat-card ${parseFloat(results.porcentajeDesperdicio) > 15 ? 'red' : 'purple'}">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${results.porcentajeDesperdicio}%</div>
                    <div class="stat-label">% Desperdicio</div>
                </div>
            </div>
        `;

        // Detail per group
        results.grupos.forEach(grupo => {
            html += `
                <div class="optimization-result">
                    <h3>
                        <span class="badge ${this.materialBadgeClass(grupo.material)}" style="margin-right:8px;">${grupo.material}</span>
                        Medida: ${grupo.medida}" — ${grupo.tubosCount} tubo${grupo.tubosCount !== 1 ? 's' : ''} — 
                        Desperdicio: ${(grupo.desperdicio / 1000).toFixed(2)}m
                    </h3>
            `;

            grupo.tubos.forEach((tubo, index) => {
                html += `
                    <div class="cut-visual">
                        <strong>Tubo ${index + 1} — Aprovechamiento: ${tubo.aprovechamiento}%</strong>
                        <div class="cut-row">
                            ${tubo.cortes.map(corte => `
                                <div class="cut-bar" style="width: ${Math.max((corte.longitud / stockLength) * 100, 5)}%"
                                     title="${corte.of} | ${corte.tipo} | ${corte.longitud}mm | ${corte.prioridad}">
                                    ${corte.of}<br>${corte.longitud}mm
                                </div>
                            `).join('')}
                            ${tubo.desperdicio > 0 ? `
                                <div class="cut-bar waste" style="width: ${Math.max((tubo.desperdicio / stockLength) * 100, 3)}%"
                                     title="Desperdicio: ${tubo.desperdicio}mm">
                                    ${tubo.desperdicio}mm
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        return html;
    }
};
