/**
 * SMART GROCERY - REALTIME FIREBASE CLOUD SYNC ENGINE
 * Handles multi-device real-time sync with Firestore onSnapshot
 * Supports auto-sync for active cart, budget settings, prices, and shopping history.
 */

class FirebaseSyncService {
  constructor() {
    this.STORAGE_CONFIG_KEY = 'smart_grocery_firebase_config';
    this.app = null;
    this.db = null;
    this.status = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'ERROR'
    this.statusListeners = [];
    
    // Unique device/session identifier to prevent echo loops
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    
    // Firestore onSnapshot unsubscribers
    this.unsubCart = null;
    this.unsubSettings = null;
    this.unsubHistory = null;
    this.unsubPriceDb = null;

    // Callbacks for incoming realtime events
    this.realtimeCallbacks = {
      onCartUpdate: null,
      onSettingsUpdate: null,
      onHistoryUpdate: null,
      onPriceDbUpdate: null
    };

    // Debounce timer for outgoing cart mutations
    this.cartSyncDebounceTimer = null;
    this.settingsSyncDebounceTimer = null;

    this.init();
  }

  onStatusChange(callback) {
    this.statusListeners.push(callback);
    callback(this.status);
  }

  setStatus(newStatus, detail = '') {
    this.status = newStatus;
    this.statusListeners.forEach(cb => cb(newStatus, detail));
  }

  getConfig() {
    try {
      const stored = localStorage.getItem(this.STORAGE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.projectId) {
          return parsed;
        }
      }
    } catch (e) {}

    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId) {
      return window.FIREBASE_CONFIG;
    }
    return null;
  }

  saveConfig(config) {
    localStorage.setItem(this.STORAGE_CONFIG_KEY, JSON.stringify(config));
    return this.init();
  }

  clearConfig() {
    this.stopRealtimeListeners();
    localStorage.removeItem(this.STORAGE_CONFIG_KEY);
    this.app = null;
    this.db = null;
    this.setStatus('DISCONNECTED', 'Mode Penyimpanan Lokal');
  }

  isConfigured() {
    const cfg = this.getConfig();
    return !!(cfg && cfg.projectId);
  }

  async init() {
    const config = this.getConfig();
    if (!config) {
      this.setStatus('DISCONNECTED', 'Belum dikonfigurasi');
      return false;
    }

    if (!window.firebase) {
      console.warn('Firebase SDK belum termuat.');
      this.setStatus('ERROR', 'SDK Firebase belum tersedia');
      return false;
    }

    try {
      this.setStatus('CONNECTING', 'Menghubungkan ke Cloud Firestore...');

      // Reuse or initialize app
      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(config);
      } else {
        this.app = firebase.app();
      }

      this.db = firebase.firestore();

      // Enable offline persistence if possible
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        // Ignored if already enabled in another tab or unsupported
      }

      this.setStatus('CONNECTED', `Realtime Cloud Aktif: ${config.projectId}`);

      // Automatically attach realtime listeners once connected
      this.attachRealtimeListeners();

      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.setStatus('ERROR', error.message || 'Gagal inisialisasi Firebase');
      return false;
    }
  }

  /**
   * Register application callbacks for real-time Firestore push updates
   */
  registerRealtimeCallbacks(callbacks = {}) {
    this.realtimeCallbacks = {
      ...this.realtimeCallbacks,
      ...callbacks
    };
    if (this.db) {
      this.attachRealtimeListeners();
    }
  }

  /**
   * Attach Firestore onSnapshot listeners for live multi-device synchronization
   */
  attachRealtimeListeners() {
    if (!this.db) return;

    this.stopRealtimeListeners();

    // 1. Realtime Active Cart Listener (SRS F-01 & F-02)
    try {
      this.unsubCart = this.db.collection('smart_grocery').doc('active_cart')
        .onSnapshot((doc) => {
          if (!doc.exists) return;
          const data = doc.data() || {};
          const isRemote = data.lastModifiedBy && data.lastModifiedBy !== this.clientId;
          const items = Array.isArray(data.items) ? data.items : [];
          
          if (this.realtimeCallbacks.onCartUpdate) {
            this.realtimeCallbacks.onCartUpdate(items, isRemote, data);
          }
        }, (error) => {
          console.warn('Realtime cart snapshot error:', error);
        });
    } catch (err) {
      console.warn('Failed to attach cart snapshot listener:', err);
    }

    // 2. Realtime Settings & Budget Limit Listener (SRS F-05)
    try {
      this.unsubSettings = this.db.collection('smart_grocery').doc('settings')
        .onSnapshot((doc) => {
          if (!doc.exists) return;
          const data = doc.data() || {};
          const isRemote = data.lastModifiedBy && data.lastModifiedBy !== this.clientId;
          
          if (this.realtimeCallbacks.onSettingsUpdate) {
            this.realtimeCallbacks.onSettingsUpdate(data, isRemote);
          }
        }, (error) => {
          console.warn('Realtime settings snapshot error:', error);
        });
    } catch (err) {
      console.warn('Failed to attach settings snapshot listener:', err);
    }

    // 3. Realtime Shopping History Sessions (SRS F-06)
    try {
      this.unsubHistory = this.db.collection('shopping_history').orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
          const sessions = [];
          snapshot.forEach(doc => sessions.push(doc.data()));
          
          if (this.realtimeCallbacks.onHistoryUpdate) {
            this.realtimeCallbacks.onHistoryUpdate(sessions);
          }
        }, (error) => {
          console.warn('Realtime history snapshot error:', error);
        });
    } catch (err) {
      console.warn('Failed to attach history snapshot listener:', err);
    }
  }

  stopRealtimeListeners() {
    if (this.unsubCart) {
      this.unsubCart();
      this.unsubCart = null;
    }
    if (this.unsubSettings) {
      this.unsubSettings();
      this.unsubSettings = null;
    }
    if (this.unsubHistory) {
      this.unsubHistory();
      this.unsubHistory = null;
    }
    if (this.unsubPriceDb) {
      this.unsubPriceDb();
      this.unsubPriceDb = null;
    }
  }

  /**
   * Schedule debounced cart update to Cloud Firestore
   * Called whenever user adds, modifies, toggles, or deletes items
   */
  scheduleRealtimeCartSync(cart) {
    if (!this.db || !this.isConfigured()) return;

    clearTimeout(this.cartSyncDebounceTimer);
    this.cartSyncDebounceTimer = setTimeout(() => {
      this.syncCartNow(cart);
    }, 200);
  }

  /**
   * Immediate write for active cart
   */
  async syncCartNow(cart) {
    if (!this.db || !this.isConfigured()) return;
    try {
      this.setStatus('SYNCING', 'Sinkronisasi keranjang...');
      const cartRef = this.db.collection('smart_grocery').doc('active_cart');
      await cartRef.set({
        items: cart || [],
        itemCount: (cart || []).length,
        lastModifiedBy: this.clientId,
        lastModifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.setStatus('CONNECTED', 'Realtime Cloud Aktif');
    } catch (e) {
      console.warn('Error syncing active cart:', e);
      this.setStatus('CONNECTED', 'Realtime Cloud Aktif');
    }
  }

  /**
   * Immediate write for settings / budget
   */
  async syncSettingsNow(settings) {
    if (!this.db || !this.isConfigured()) return;
    try {
      this.setStatus('SYNCING', 'Sinkronisasi anggaran...');
      const settingsRef = this.db.collection('smart_grocery').doc('settings');
      await settingsRef.set({
        ...settings,
        lastModifiedBy: this.clientId,
        lastModifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      this.setStatus('CONNECTED', 'Realtime Cloud Aktif');
    } catch (e) {
      console.warn('Error syncing settings:', e);
      this.setStatus('CONNECTED', 'Realtime Cloud Aktif');
    }
  }

  /**
   * Immediate write for a completed shopping session
   */
  async syncSessionNow(session) {
    if (!this.db || !this.isConfigured()) return;
    try {
      this.setStatus('SYNCING', 'Menyimpan riwayat belanja...');
      const sessRef = this.db.collection('shopping_history').doc(session.id);
      await sessRef.set({
        ...session,
        lastModifiedBy: this.clientId,
        syncedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      this.setStatus('CONNECTED', 'Realtime Cloud Aktif');
    } catch (e) {
      console.warn('Error syncing history session:', e);
      this.setStatus('CONNECTED', 'Realtime Cloud Aktif');
    }
  }

  /**
   * Upload all local application state to Firebase Cloud Firestore
   */
  async uploadAllData(localState) {
    if (!this.isConfigured() || !this.db) {
      const ok = await this.init();
      if (!ok) {
        throw new Error('Firebase belum dikonfigurasi. Masukkan Firebase Config terlebih dahulu.');
      }
    }

    this.setStatus('SYNCING', 'Mengunggah seluruh data ke Cloud...');

    try {
      const batch = this.db.batch();

      // 1. Settings & Budget Limit (SRS F-05)
      const settingsRef = this.db.collection('smart_grocery').doc('settings');
      batch.set(settingsRef, {
        budgetLimit: localState.budgetLimit || 500000,
        soundEnabled: localState.soundEnabled !== false,
        activeCategory: localState.activeCategory || 'ALL',
        lastModifiedBy: this.clientId,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 2. Active Trolley / Cart (SRS F-01 & F-02)
      const cartRef = this.db.collection('smart_grocery').doc('active_cart');
      batch.set(cartRef, {
        items: localState.cart || [],
        itemCount: (localState.cart || []).length,
        lastModifiedBy: this.clientId,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 3. Price Database Benchmarks (SRS F-04 & F-06)
      const priceDbRef = this.db.collection('smart_grocery').doc('price_database');
      batch.set(priceDbRef, {
        benchmarks: localState.priceDatabase || {},
        lastModifiedBy: this.clientId,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      // 4. Shopping History Sessions (SRS F-06)
      if (Array.isArray(localState.historySessions)) {
        const historyBatch = this.db.batch();
        for (const session of localState.historySessions) {
          if (session && session.id) {
            const sessRef = this.db.collection('shopping_history').doc(session.id);
            historyBatch.set(sessRef, {
              ...session,
              lastModifiedBy: this.clientId,
              syncedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }
        await historyBatch.commit();
      }

      this.setStatus('CONNECTED', 'Semua data berhasil disinkronkan ke Firebase!');
      return { success: true };
    } catch (err) {
      console.error('Firebase upload error:', err);
      this.setStatus('ERROR', 'Gagal unggah: ' + err.message);
      throw err;
    }
  }

  /**
   * Fetch data from Firebase Cloud Firestore to local
   */
  async downloadAllData() {
    if (!this.isConfigured() || !this.db) {
      const ok = await this.init();
      if (!ok) throw new Error('Firebase belum terhubung.');
    }

    this.setStatus('SYNCING', 'Mengambil data dari Cloud...');

    try {
      const result = {};

      // 1. Get settings
      const settingsSnap = await this.db.collection('smart_grocery').doc('settings').get();
      if (settingsSnap.exists) {
        result.settings = settingsSnap.data();
      }

      // 2. Get active cart
      const cartSnap = await this.db.collection('smart_grocery').doc('active_cart').get();
      if (cartSnap.exists) {
        result.cart = cartSnap.data().items || [];
      }

      // 3. Get price database
      const priceSnap = await this.db.collection('smart_grocery').doc('price_database').get();
      if (priceSnap.exists) {
        result.priceDatabase = priceSnap.data().benchmarks || {};
      }

      // 4. Get shopping history
      const historySnap = await this.db.collection('shopping_history').orderBy('timestamp', 'desc').get();
      result.historySessions = [];
      historySnap.forEach(doc => {
        result.historySessions.push(doc.data());
      });

      this.setStatus('CONNECTED', 'Data cloud berhasil diunduh.');
      return result;
    } catch (err) {
      console.error('Firebase download error:', err);
      this.setStatus('ERROR', 'Gagal unduh: ' + err.message);
      throw err;
    }
  }
}

// Global instance
window.firebaseSyncService = new FirebaseSyncService();
