/**
 * SMART GROCERY - FIREBASE CLOUD SYNC ENGINE
 * Handles Firestore cloud synchronization for cart, budget, price database, and shopping history.
 */

class FirebaseSyncService {
  constructor() {
    this.STORAGE_CONFIG_KEY = 'smart_grocery_firebase_config';
    this.app = null;
    this.db = null;
    this.status = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
    this.statusListeners = [];
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
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {}

    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId && window.FIREBASE_CONFIG.apiKey) {
      return window.FIREBASE_CONFIG;
    }
    return null;
  }

  saveConfig(config) {
    localStorage.setItem(this.STORAGE_CONFIG_KEY, JSON.stringify(config));
    return this.init();
  }

  clearConfig() {
    localStorage.removeItem(this.STORAGE_CONFIG_KEY);
    this.app = null;
    this.db = null;
    this.setStatus('DISCONNECTED');
  }

  isConfigured() {
    const cfg = this.getConfig();
    return !!(cfg && cfg.apiKey && cfg.projectId);
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
        // Ignored if already enabled or unsupported
      }

      this.setStatus('CONNECTED', `Terhubung ke Project: ${config.projectId}`);
      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.setStatus('ERROR', error.message || 'Gagal inisialisasi Firebase');
      return false;
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

    this.setStatus('SYNCING', 'Mengunggah data ke Cloud Firestore...');

    try {
      const batch = this.db.batch();

      // 1. Settings & Budget Limit (SRS F-05)
      const settingsRef = this.db.collection('smart_grocery').doc('settings');
      batch.set(settingsRef, {
        budgetLimit: localState.budgetLimit || 500000,
        soundEnabled: localState.soundEnabled !== false,
        activeCategory: localState.activeCategory || 'ALL',
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 2. Active Trolley / Cart (SRS F-01 & F-02)
      const cartRef = this.db.collection('smart_grocery').doc('active_cart');
      batch.set(cartRef, {
        items: localState.cart || [],
        itemCount: (localState.cart || []).length,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 3. Price Database Benchmarks (SRS F-04 & F-06)
      const priceDbRef = this.db.collection('smart_grocery').doc('price_database');
      batch.set(priceDbRef, {
        benchmarks: localState.priceDatabase || {},
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
