// ============================================
// App Module - Main Application Logic
// ============================================

// Global state
let ordenesTrabajo = [];
let stockData = [];
let appConfig = {};
let currentSection = 'dashboard';

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></svg>', error: '<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='15' y1='9' x2='9' y2='15'/><line x1='9' y1='9' x2='15' y2='15'/></svg>', warning: '<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>', info: '<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='12' y1='16' x2='12' y2='12'/><line x1='12' y1='8' x2='12.01' y2='8'/></svg>' };
    const titles = { success: 'Éxito', error: 'Error', warning: 'Atención', info: 'Info' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${titles[type] || titles.info}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==========================================
// NAVIGATION
// ==========================================

const App = {
    navigateTo(section) {
        currentSection = section;

        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.style.display = 'none');

        // Show target section
        const target = document.getElementById(`section-${section}`);
        if (target) target.style.display = 'block';

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Close mobile sidebar
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('active');

        // Section-specific init
        if (section === 'optimizacion') this.renderOptimizacion();
        if (section === 'config') this.loadConfigUI();
    },

    // ==========================================
    // DASHBOARD
    // ==========================================

    renderDashboard() {
        const totalOF = ordenesTrabajo.length;
        const uniqueEquipos = [...new Set(ordenesTrabajo.map(of => of.numero))];
        const totalEquipos = uniqueEquipos.length;
        const equiposCompletos = uniqueEquipos.filter(num => {
            const items = ordenesTrabajo.filter(of => of.numero === num);
            const total = items.reduce((s, i) => s + (i.cantidad || 0), 0);
            const done = items.reduce((s, i) => s + (i.completedCount || 0), 0);
            return done >= total && total > 0;
        }).length;

        const totalCortesPendientes = ordenesTrabajo.reduce((sum, of) =>
            sum + Math.max(0, (of.cantidad || 0) - (of.completedCount || 0)), 0);
        const totalCortesRealizados = ordenesTrabajo.reduce((sum, of) =>
            sum + (of.completedCount || 0), 0);

        const allDurations = ordenesTrabajo.reduce((arr, of) =>
            arr.concat(of.tiempos_corte || []), []);
        const avgDuration = allDurations.length > 0
            ? Math.round(allDurations.reduce((s, t) => s + t, 0) / allDurations.length)
            : 0;

        let metrosCu = 0, metrosFe = 0;
        ordenesTrabajo.forEach(of => {
            const pendientes = Math.max(0, (of.cantidad || 0) - (of.completedCount || 0));
            const metros = ((of.longitud || 0) * pendientes) / 1000;
            if (Optimizer.normalizarMaterial(of.material) === 'Cobre') metrosCu += metros;
            else metrosFe += metros;
        });

        const el = (id, val) => {
            const e = document.getElementById(id);
            if (e) e.textContent = val;
        };

        el('statTotalOF', totalOF);
        el('statEquipos', totalEquipos);
        el('statEquiposCompletos', equiposCompletos);
        el('statCortesPendientes', totalCortesPendientes);
        el('statCortesRealizados', totalCortesRealizados);
        el('statTiempoMedio', this.formatDuration(avgDuration));
        el('statMetrosCobre', metrosCu.toFixed(1) + ' m');
        el('statMetrosHierro', metrosFe.toFixed(1) + ' m');

        // Update nav badge
        const badge = document.getElementById('ordenesNavBadge');
        if (badge) {
            badge.textContent = totalOF;
            badge.style.display = totalOF > 0 ? 'inline' : 'none';
        }

        // Render dashboard preview table (last 6 orders)
        const dashTbody = document.getElementById('dashboardTableBody');
        if (dashTbody) {
            const recent = ordenesTrabajo.slice(0, 6);
            if (recent.length === 0) {
                dashTbody.innerHTML = '<tr><td colspan="8"><div class="table-empty"><div class="table-empty-icon"></div><div class="table-empty-text">Sin órdenes de trabajo</div></div></td></tr>';
            } else {
                dashTbody.innerHTML = recent.map(of => {
                    const completados = of.completedCount || 0;
                    const progress = (of.cantidad || 0) > 0 ? ((completados / of.cantidad) * 100) : 0;
                    return `
                        <tr>
                            <td><strong>${of.numero || ''}</strong></td>
                            <td>${of.tipo || ''}</td>
                            <td>${of.medida || ''}"</td>
                            <td><span class="badge ${Optimizer.materialBadgeClass(of.material)}">${of.material || ''}</span></td>
                            <td>${of.longitud || 0}</td>
                            <td>${of.cantidad || 0}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <span class="text-sm">${completados}/${of.cantidad || 0}</span>
                                    <div class="progress-bar" style="width:50px;">
                                        <div class="progress-fill" style="width:${progress}%"></div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="badge ${Optimizer.priorityBadgeClass(of.prioridad)}">${of.prioridad || 'Normal'}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    },

    // ==========================================
    // ORDENES TABLE
    // ==========================================

    renderOrdenes() {
        const tbody = document.getElementById('ofTableBody');
        if (!tbody) return;

        // Apply filters
        let filtered = [...ordenesTrabajo];
        const searchTerm = document.getElementById('filterSearch')?.value?.toLowerCase() || '';
        const filterMaterial = document.getElementById('filterMaterial')?.value || '';
        const filterPrioridad = document.getElementById('filterPrioridad')?.value || '';
        const filterEstado = document.getElementById('filterEstado')?.value || '';

        if (searchTerm) {
            filtered = filtered.filter(of =>
                (of.numero || '').toLowerCase().includes(searchTerm) ||
                (of.tipo || '').toLowerCase().includes(searchTerm) ||
                (of.medida || '').toLowerCase().includes(searchTerm)
            );
        }
        if (filterMaterial) {
            filtered = filtered.filter(of => Optimizer.normalizarMaterial(of.material) === filterMaterial);
        }
        if (filterPrioridad) {
            filtered = filtered.filter(of => Optimizer.normalizarPrioridad(of.prioridad) === filterPrioridad);
        }
        if (filterEstado) {
            filtered = filtered.filter(of => {
                const comp = (of.completedCount || 0) >= (of.cantidad || 0);
                if (filterEstado === 'completado') return comp;
                if (filterEstado === 'pendiente') return !comp;
                return true;
            });
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11">
                        <div class="table-empty">
                            <div class="table-empty-icon"></div>
                            <div class="table-empty-text">${ordenesTrabajo.length === 0 ? 'No hay órdenes de trabajo' : 'No hay resultados con los filtros actuales'}</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(of => {
            const pendientes = Math.max(0, (of.cantidad || 0) - (of.completedCount || 0));
            const completados = of.completedCount || 0;
            const isComplete = pendientes === 0 && (of.cantidad || 0) > 0;
            const completedClass = isComplete ? 'completed' : '';
            const progress = (of.cantidad || 0) > 0 ? ((completados / of.cantidad) * 100) : 0;

            const equipoInfo = this.getEquipoInfo(of.numero);
            const avgTime = this.getAverageDuration(of);

            return `
                <tr class="${completedClass}">
                    <td><strong>${of.numero || ''}</strong></td>
                    <td>${of.tipo || ''}</td>
                    <td>${of.medida || ''}"</td>
                    <td><span class="badge ${Optimizer.materialBadgeClass(of.material)}">${of.material || ''}</span></td>
                    <td>${of.longitud || 0}</td>
                    <td>${of.cantidad || 0}</td>
                    <td>
                        <div class="completion-cell">
                            <div class="completion-controls">
                                <button class="btn btn-ghost btn-icon btn-xs" onclick="App.decrementarCompletados('${of.id}')" ${completados <= 0 ? 'disabled' : ''}>−</button>
                                <span class="completion-count">${completados}</span>
                                <button class="btn btn-primary btn-icon btn-xs" onclick="App.incrementarCompletados('${of.id}')" ${isComplete ? 'disabled' : ''}>+</button>
                            </div>
                            <div class="progress-bar" style="width:60px;">
                                <div class="progress-fill" style="width:${progress}%"></div>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge ${Optimizer.priorityBadgeClass(of.prioridad)}">${of.prioridad || 'Normal'}</span></td>
                    <td><span class="badge ${equipoInfo.completo ? 'badge-completado' : 'badge-pendiente'}">${equipoInfo.completo ? 'COMPLETO' : equipoInfo.completadas + '/' + equipoInfo.totalPiezas}</span></td>
                    <td class="text-sm text-muted">${this.formatDuration(avgTime)}</td>
                    <td>
                        <div class="action-row gap-2">
                            <button class="btn btn-ghost btn-icon btn-xs" onclick="App.toggleCorte('${of.id}')" title="${of.corte_inicio ? 'Pausar timer' : 'Iniciar timer'}">
                                ${of.corte_inicio ? '<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='6' y='4' width='4' height='16'/><rect x='14' y='4' width='4' height='16'/></svg>' : '<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='5 3 19 12 5 21 5 3'/></svg>'}
                            </button>
                            <button class="btn btn-ghost btn-icon btn-xs" onclick="App.eliminarOrden('${of.id}')" title="Eliminar" style="color:var(--red);">
                                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // ==========================================
    // ORDER ACTIONS
    // ==========================================

    async incrementarCompletados(id) {
        const of = ordenesTrabajo.find(o => o.id === id);
        if (!of) return;

        const current = of.completedCount || 0;
        if (current >= (of.cantidad || 0)) return;

        const updates = { completedCount: current + 1 };

        // If timer was running, record the duration
        if (of.corte_inicio) {
            const duration = Date.now() - of.corte_inicio;
            updates.tiempos_corte = firebase.firestore.FieldValue.arrayUnion(duration);
            updates.corte_inicio = null;
        }

        // Check if now complete
        if (current + 1 >= (of.cantidad || 0)) {
            updates.estado = 'completado';
        } else {
            updates.estado = 'en_progreso';
        }

        try {
            await DB.actualizarOrden(id, updates);
        } catch (error) {
            showToast('Error al actualizar', 'error');
        }
    },

    async decrementarCompletados(id) {
        const of = ordenesTrabajo.find(o => o.id === id);
        if (!of) return;

        const current = of.completedCount || 0;
        if (current <= 0) return;

        const updates = {
            completedCount: current - 1,
            estado: current - 1 > 0 ? 'en_progreso' : 'pendiente'
        };

        // Remove last duration
        if (of.tiempos_corte && of.tiempos_corte.length > 0) {
            const newDurations = [...of.tiempos_corte];
            newDurations.pop();
            updates.tiempos_corte = newDurations;
        }

        try {
            await DB.actualizarOrden(id, updates);
        } catch (error) {
            showToast('Error al actualizar', 'error');
        }
    },

    async toggleCorte(id) {
        const of = ordenesTrabajo.find(o => o.id === id);
        if (!of) return;

        const updates = {};
        if (of.corte_inicio) {
            // Pause - don't record duration until completion
            updates.corte_inicio = null;
        } else {
            // Start timer
            updates.corte_inicio = Date.now();
            updates.estado = 'en_progreso';
        }

        try {
            await DB.actualizarOrden(id, updates);
        } catch (error) {
            showToast('Error al actualizar timer', 'error');
        }
    },

    async eliminarOrden(id) {
        if (!confirm('¿Eliminar esta orden de trabajo?')) return;
        try {
            await DB.eliminarOrden(id);
            showToast('Orden eliminada', 'info');
        } catch (error) {
            showToast('Error al eliminar', 'error');
        }
    },

    async eliminarTodas() {
        if (!confirm('<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg> ¿Eliminar TODAS las órdenes de trabajo? Esta acción no se puede deshacer.')) return;
        try {
            const count = await DB.eliminarTodasOrdenes();
            showToast(`Se eliminaron ${count} órdenes`, 'info');
        } catch (error) {
            showToast('Error al eliminar', 'error');
        }
    },

    // ==========================================
    // ADD ORDER MANUALLY
    // ==========================================

    async agregarOrdenManual(e) {
        e.preventDefault();

        const orden = {
            numero: document.getElementById('ofNumero').value.trim(),
            tipo: document.getElementById('ofTipo')?.value || 'colector',
            medida: document.getElementById('ofMedida').value,
            material: document.getElementById('ofMaterial')?.value || 'Cobre',
            longitud: parseInt(document.getElementById('ofLongitud')?.value || '1000', 10),
            cantidad: parseInt(document.getElementById('ofCantidad').value || '1', 10),
            prioridad: document.getElementById('ofPrioridad')?.value || 'Normal',
            completedCount: 0,
            tiempos_corte: [],
            corte_inicio: null,
            estado: 'pendiente'
        };

        if (!orden.numero || !orden.medida || isNaN(orden.longitud) || isNaN(orden.cantidad)) {
            showToast('Rellena todos los campos obligatorios', 'warning');
            return;
        }

        try {
            await DB.agregarOrden(orden);
            showToast(`Orden ${orden.numero} añadida`, 'success');
            document.getElementById('ofForm')?.reset();
            document.getElementById('ofNumero')?.focus();
        } catch (error) {
            showToast('Error al añadir orden', 'error');
        }
    },

    // ==========================================
    // OPTIMIZATION
    // ==========================================

    async renderOptimizacion() {
        const config = appConfig;
        const stockLength = config.longitud_tubo_estandar || 6000;
        const mermaTubo = config.merma_tubo || 3;

        // Update config inputs
        const slEl = document.getElementById('optStockLength');
        const mtEl = document.getElementById('optMerma');
        if (slEl) slEl.value = stockLength;
        if (mtEl) mtEl.value = mermaTubo;
    },

    optimizarCortes() {
        if (ordenesTrabajo.length === 0) {
            showToast('No hay órdenes de trabajo registradas', 'warning');
            return;
        }

        const stockLength = parseInt(document.getElementById('optStockLength')?.value || '6000', 10);
        const mermaTubo = parseInt(document.getElementById('optMerma')?.value || '3', 10);

        const results = Optimizer.optimizar(ordenesTrabajo, stockLength, mermaTubo);
        const html = Optimizer.renderResultados(results, stockLength);

        const container = document.getElementById('optimizationContent');
        if (container) {
            container.innerHTML = html;
            container.style.display = 'block';
        }

        // Navigate to optimization section if not there
        if (currentSection !== 'optimizacion') {
            this.navigateTo('optimizacion');
        }
    },

    // ==========================================
    // STOCK
    // ==========================================

    renderStock() {
        const tbody = document.getElementById('stockTableBody');
        if (!tbody) return;

        if (stockData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="table-empty">
                            <div class="table-empty-icon"></div>
                            <div class="table-empty-text">No hay stock configurado</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = stockData.map(item => `
            <tr>
                <td>${item.medida}"</td>
                <td><span class="badge ${Optimizer.materialBadgeClass(item.material)}">${item.material}</span></td>
                <td>
                    <input type="number" class="form-input stock-input" value="${item.cantidad || 0}"
                           onchange="App.updateStock('${item.id}', this.value)" min="0">
                </td>
                <td>
                    <button class="btn btn-ghost btn-icon btn-xs" onclick="App.deleteStock('${item.id}')" style="color:var(--red);"><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/></svg></button>
                </td>
            </tr>
        `).join('');
    },

    async updateStock(id, cantidad) {
        try {
            await DB.actualizarStock(id, cantidad);
        } catch (error) {
            showToast('Error al actualizar stock', 'error');
        }
    },

    async deleteStock(id) {
        if (!confirm('¿Eliminar este item de stock?')) return;
        try {
            await DB.eliminarStock(id);
            showToast('Stock eliminado', 'info');
        } catch (error) {
            showToast('Error al eliminar stock', 'error');
        }
    },

    async agregarStock(e) {
        e.preventDefault();
        const medida = document.getElementById('newStockMedida')?.value;
        const material = document.getElementById('newStockMaterial')?.value;
        const cantidad = parseInt(document.getElementById('newStockCantidad')?.value || '0', 10);

        if (!medida || !material) {
            showToast('Selecciona medida y material', 'warning');
            return;
        }

        try {
            await DB.agregarStock(medida, material, cantidad);
            showToast(`Stock ${medida}" ${material} añadido`, 'success');
            document.getElementById('stockForm')?.reset();
        } catch (error) {
            showToast('Error al añadir stock', 'error');
        }
    },

    // ==========================================
    // CONFIGURATION
    // ==========================================

    async loadConfigUI() {
        const config = appConfig;
        const el = (id, val) => {
            const e = document.getElementById(id);
            if (e) e.value = val;
        };

        el('configTubeLength', config.longitud_tubo_estandar || 6000);
        el('configMerma', config.merma_tubo || 3);
        el('configMedidas', (config.medidas_disponibles || []).join(', '));
        el('configMateriales', (config.materiales || []).join(', '));
        el('configTipos', (config.tipos || []).join(', '));
    },

    async guardarConfiguracion(e) {
        e.preventDefault();

        const config = {
            longitud_tubo_estandar: parseInt(document.getElementById('configTubeLength')?.value || '6000', 10),
            merma_tubo: parseInt(document.getElementById('configMerma')?.value || '3', 10),
            medidas_disponibles: (document.getElementById('configMedidas')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
            materiales: (document.getElementById('configMateriales')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
            tipos: (document.getElementById('configTipos')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
        };

        try {
            await DB.guardarConfiguracion(config);
            appConfig = config;
            showToast('Configuración guardada', 'success');
        } catch (error) {
            showToast('Error al guardar configuración', 'error');
        }
    },

    // ==========================================
    // HELPERS
    // ==========================================

    getEquipoInfo(numero) {
        const items = ordenesTrabajo.filter(of => of.numero === numero);
        const totalPiezas = items.reduce((sum, i) => sum + (i.cantidad || 0), 0);
        const completadas = items.reduce((sum, i) => sum + (i.completedCount || 0), 0);
        return {
            totalPiezas,
            completadas,
            pendientes: Math.max(0, totalPiezas - completadas),
            completo: completadas >= totalPiezas && totalPiezas > 0
        };
    },

    getAverageDuration(of) {
        if (!of.tiempos_corte || of.tiempos_corte.length === 0) return 0;
        const total = of.tiempos_corte.reduce((sum, t) => sum + t, 0);
        return Math.round(total / of.tiempos_corte.length);
    },

    formatDuration(ms) {
        if (!ms || ms === 0) return '—';
        const seconds = Math.round(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        if (minutes === 0) return `${remaining}s`;
        return `${minutes}m ${remaining}s`;
    }
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App initializing...');

    // Initialize DB module
    DB.init();

    // Load configuration
    appConfig = await DB.obtenerConfiguracion();
    console.log(' Config loaded:', appConfig);

    // Initialize default stock if needed
    await DB.inicializarStock();

    // Set up real-time listeners
    DB.listenOrdenes(ordenes => {
        ordenesTrabajo = ordenes;
        App.renderDashboard();
        App.renderOrdenes();
        console.log(` Orders updated: ${ordenes.length} total`);

        // Update connection status
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        if (dot) dot.classList.add('connected');
        if (text) text.textContent = 'Conectado';
    });

    DB.listenStock(stock => {
        stockData = stock;
        App.renderStock();
    });

    // Set up navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            if (section) App.navigateTo(section);
        });
    });

    // Mobile sidebar toggle
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
        document.getElementById('sidebarOverlay')?.classList.toggle('active');
    });

    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('active');
    });

    // Manual order form
    document.getElementById('ofForm')?.addEventListener('submit', (e) => App.agregarOrdenManual(e));

    // Stock form
    document.getElementById('stockForm')?.addEventListener('submit', (e) => App.agregarStock(e));

    // Config form
    document.getElementById('configForm')?.addEventListener('submit', (e) => App.guardarConfiguracion(e));

    // Filter listeners
    ['filterSearch', 'filterMaterial', 'filterPrioridad', 'filterEstado'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => App.renderOrdenes());
        document.getElementById(id)?.addEventListener('change', () => App.renderOrdenes());
    });

    // Drag and drop on import zone
    const importZone = document.getElementById('importZone');
    if (importZone) {
        importZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            importZone.classList.add('dragover');
        });
        importZone.addEventListener('dragleave', () => {
            importZone.classList.remove('dragover');
        });
        importZone.addEventListener('drop', (e) => {
            e.preventDefault();
            importZone.classList.remove('dragover');
            const fileInput = document.getElementById('importFile');
            if (fileInput && e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                Import.importarDesdeArchivo();
            }
        });
    }

    // Show dashboard
    App.navigateTo('dashboard');
    showToast('Plataforma conectada a Firebase', 'success');
    console.log('<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></svg> App initialized successfully');
});
