// ============================================
// Database Module - Firestore CRUD Operations
// ============================================

const DB = {
    // Firestore reference (initialized after firebase-config.js loads)
    _db: null,
    _listeners: [],

    // Initialize
    init() {
        this._db = firebase.firestore();
        console.log('📦 Firestore DB module initialized');
    },

    // ==========================================
    // ORDENES DE TRABAJO
    // ==========================================

    /**
     * Listen to orders in real-time
     * @param {Function} callback - Called with array of orders on every change
     * @returns {Function} unsubscribe function
     */
    listenOrdenes(callback) {
        const unsubscribe = this._db.collection('ordenes_trabajo')
            .orderBy('creado_en', 'desc')
            .onSnapshot(snapshot => {
                const ordenes = [];
                snapshot.forEach(doc => {
                    ordenes.push({ id: doc.id, ...doc.data() });
                });
                callback(ordenes);
            }, error => {
                console.error('Error listening to orders:', error);
                if (typeof showToast === 'function') {
                    showToast('Error de conexión con la base de datos', 'error');
                }
            });
        this._listeners.push(unsubscribe);
        return unsubscribe;
    },

    /**
     * Add a single order
     */
    async agregarOrden(orden) {
        try {
            orden.creado_en = firebase.firestore.FieldValue.serverTimestamp();
            orden.actualizado_en = firebase.firestore.FieldValue.serverTimestamp();
            const ref = await this._db.collection('ordenes_trabajo').add(orden);
            console.log('✅ Order added:', ref.id);
            return ref.id;
        } catch (error) {
            console.error('Error adding order:', error);
            throw error;
        }
    },

    /**
     * Update specific fields of an order
     */
    async actualizarOrden(id, datos) {
        try {
            datos.actualizado_en = firebase.firestore.FieldValue.serverTimestamp();
            await this._db.collection('ordenes_trabajo').doc(id).update(datos);
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }
    },

    /**
     * Delete a single order
     */
    async eliminarOrden(id) {
        try {
            await this._db.collection('ordenes_trabajo').doc(id).delete();
            console.log('🗑️ Order deleted:', id);
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    },

    /**
     * Batch import multiple orders (handles >500 limit)
     */
    async importarOrdenes(ordenes) {
        try {
            const BATCH_SIZE = 450; // Firestore limit is 500
            const batches = [];

            for (let i = 0; i < ordenes.length; i += BATCH_SIZE) {
                const chunk = ordenes.slice(i, i + BATCH_SIZE);
                const batch = this._db.batch();

                chunk.forEach(orden => {
                    const ref = this._db.collection('ordenes_trabajo').doc();
                    orden.creado_en = firebase.firestore.FieldValue.serverTimestamp();
                    orden.actualizado_en = firebase.firestore.FieldValue.serverTimestamp();
                    batch.set(ref, orden);
                });

                batches.push(batch.commit());
            }

            await Promise.all(batches);
            console.log(`✅ Imported ${ordenes.length} orders in ${batches.length} batch(es)`);
            return ordenes.length;
        } catch (error) {
            console.error('Error importing orders:', error);
            throw error;
        }
    },

    /**
     * Delete all orders
     */
    async eliminarTodasOrdenes() {
        try {
            const snapshot = await this._db.collection('ordenes_trabajo').get();
            if (snapshot.empty) return 0;

            const BATCH_SIZE = 450;
            const docs = snapshot.docs;
            const batches = [];

            for (let i = 0; i < docs.length; i += BATCH_SIZE) {
                const chunk = docs.slice(i, i + BATCH_SIZE);
                const batch = this._db.batch();
                chunk.forEach(doc => batch.delete(doc.ref));
                batches.push(batch.commit());
            }

            await Promise.all(batches);
            console.log(`🗑️ Deleted ${docs.length} orders`);
            return docs.length;
        } catch (error) {
            console.error('Error deleting all orders:', error);
            throw error;
        }
    },

    // ==========================================
    // STOCK
    // ==========================================

    /**
     * Listen to stock in real-time
     */
    listenStock(callback) {
        const unsubscribe = this._db.collection('stock')
            .onSnapshot(snapshot => {
                const stock = [];
                snapshot.forEach(doc => {
                    stock.push({ id: doc.id, ...doc.data() });
                });
                callback(stock);
            }, error => {
                console.error('Error listening to stock:', error);
            });
        this._listeners.push(unsubscribe);
        return unsubscribe;
    },

    /**
     * Update stock quantity for a specific item
     */
    async actualizarStock(id, cantidad) {
        try {
            await this._db.collection('stock').doc(id).set({
                cantidad: parseInt(cantidad, 10),
                actualizado_en: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    },

    /**
     * Initialize default stock if empty
     */
    async inicializarStock() {
        try {
            const snapshot = await this._db.collection('stock').get();
            if (!snapshot.empty) return; // Stock already exists

            const defaults = [
                { medida: '1/2', material: 'Cobre', cantidad: 10 },
                { medida: '1/2', material: 'Hierro', cantidad: 10 },
                { medida: '3/8', material: 'Cobre', cantidad: 10 },
                { medida: '3/8', material: 'Hierro', cantidad: 10 },
                { medida: '5/8', material: 'Cobre', cantidad: 10 },
                { medida: '5/8', material: 'Hierro', cantidad: 10 },
            ];

            const batch = this._db.batch();
            defaults.forEach(item => {
                const id = `${item.medida.replace(/\//g, '_')}-${item.material}`;
                const ref = this._db.collection('stock').doc(id);
                batch.set(ref, {
                    ...item,
                    actualizado_en: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();
            console.log('📦 Default stock initialized');
        } catch (error) {
            console.error('Error initializing stock:', error);
        }
    },

    /**
     * Add a new stock item
     */
    async agregarStock(medida, material, cantidad) {
        const id = `${medida.replace(/\//g, '_')}-${material}`;
        try {
            await this._db.collection('stock').doc(id).set({
                medida,
                material,
                cantidad: parseInt(cantidad, 10),
                actualizado_en: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error adding stock:', error);
            throw error;
        }
    },

    /**
     * Delete a stock item
     */
    async eliminarStock(id) {
        try {
            await this._db.collection('stock').doc(id).delete();
        } catch (error) {
            console.error('Error deleting stock:', error);
            throw error;
        }
    },

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================

    /**
     * Get app configuration
     */
    async obtenerConfiguracion() {
        try {
            const doc = await this._db.collection('configuracion').doc('general').get();
            if (doc.exists) return doc.data();

            // Default configuration
            const defaultConfig = {
                longitud_tubo_estandar: 6000,
                merma_tubo: 3,
                medidas_disponibles: ['1/2', '3/8', '5/8', '2', '1 5/8'],
                materiales: ['Cobre', 'Hierro'],
                tipos: ['colector', 'manguito']
            };

            await this._db.collection('configuracion').doc('general').set(defaultConfig);
            console.log('⚙️ Default configuration created');
            return defaultConfig;
        } catch (error) {
            console.error('Error getting configuration:', error);
            // Return hardcoded defaults on error
            return {
                longitud_tubo_estandar: 6000,
                merma_tubo: 3,
                medidas_disponibles: ['1/2', '3/8', '5/8', '2', '1 5/8'],
                materiales: ['Cobre', 'Hierro'],
                tipos: ['colector', 'manguito']
            };
        }
    },

    /**
     * Save app configuration
     */
    async guardarConfiguracion(config) {
        try {
            await this._db.collection('configuracion').doc('general').set(config, { merge: true });
            console.log('⚙️ Configuration saved');
        } catch (error) {
            console.error('Error saving configuration:', error);
            throw error;
        }
    },

    // ==========================================
    // CLEANUP
    // ==========================================

    /**
     * Unsubscribe all real-time listeners
     */
    cleanup() {
        this._listeners.forEach(unsub => unsub());
        this._listeners = [];
        console.log('🧹 All listeners cleaned up');
    }
};
