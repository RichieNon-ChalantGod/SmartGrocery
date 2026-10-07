/**
 * SMART GROCERY & BUDGET SAFETY TRACKER - CORE APPLICATION ENGINE
 * Progressive Web App for University Students / Anak Rantau
 * Implements SRS Checklist: F-01 to F-06
 */

// ================= INITIAL SEED DATA =================
// Realistic Indonesian grocery items with past month (September 2026) benchmarks
const INITIAL_BENCHMARK_PRICES = {
  "beras ramos 5kg": { name: "Beras Ramos 5kg", category: "Bahan Pokok", unit: "pack", pastPrice: 69000, lastUpdated: "Sep 2026" },
  "telur ayam 1kg": { name: "Telur Ayam 1kg", category: "Protein & Sayur", unit: "kg", pastPrice: 28500, lastUpdated: "Sep 2026" },
  "minyak goreng sania 2l": { name: "Minyak Goreng Sania 2L", category: "Bahan Pokok", unit: "liter", pastPrice: 34000, lastUpdated: "Sep 2026" },
  "indomie goreng (isi 5)": { name: "Indomie Goreng (isi 5)", category: "Bahan Pokok", unit: "pack", pastPrice: 15500, lastUpdated: "Sep 2026" },
  "susu uht ultra milk 1l": { name: "Susu UHT Ultra Milk 1L", category: "Minuman & Snack", unit: "liter", pastPrice: 19500, lastUpdated: "Sep 2026" },
  "bawang merah 250gr": { name: "Bawang Merah 250gr", category: "Bumbu Dapur", unit: "pack", pastPrice: 11000, lastUpdated: "Sep 2026" },
  "bawang putih 250gr": { name: "Bawang Putih 250gr", category: "Bumbu Dapur", unit: "pack", pastPrice: 10500, lastUpdated: "Sep 2026" },
  "deterjen rinso 770g": { name: "Deterjen Rinso 770g", category: "Kebersihan & Mandi", unit: "pack", pastPrice: 23000, lastUpdated: "Sep 2026" },
  "sabun cair lifebuoy 450ml": { name: "Sabun Cair Lifebuoy 450ml", category: "Kebersihan & Mandi", unit: "botol", pastPrice: 21500, lastUpdated: "Sep 2026" },
  "shampoo pantene 160ml": { name: "Shampoo Pantene 160ml", category: "Kebersihan & Mandi", unit: "botol", pastPrice: 25000, lastUpdated: "Sep 2026" },
  "kopi kapal api special": { name: "Kopi Kapal Api Special", category: "Minuman & Snack", unit: "pack", pastPrice: 14000, lastUpdated: "Sep 2026" },
  "kecap manis bango 550ml": { name: "Kecap Manis Bango 550ml", category: "Bumbu Dapur", unit: "botol", pastPrice: 24500, lastUpdated: "Sep 2026" }
};

const INITIAL_ACTIVE_CART = [
  {
    id: "item_seed_1",
    name: "Beras Ramos 5kg",
    category: "Bahan Pokok",
    unit: "pack",
    qty: 1,
    price: 72000, // Naik dari 69.000 -> shows RED UP arrow
    discountRaw: "",
    inTrolley: true,
    createdAt: Date.now() - 3600000
  },
  {
    id: "item_seed_2",
    name: "Minyak Goreng Sania 2L",
    category: "Bahan Pokok",
    unit: "liter",
    qty: 1,
    price: 32000, // Turun dari 34.000 -> shows GREEN DOWN arrow
    discountRaw: "10%",
    inTrolley: true,
    createdAt: Date.now() - 3000000
  },
  {
    id: "item_seed_3",
    name: "Indomie Goreng (isi 5)",
    category: "Bahan Pokok",
    unit: "pack",
    qty: 2,
    price: 15500, // Stabil sama dengan 15.500 -> shows EQUAL sign
    discountRaw: "",
    inTrolley: true,
    createdAt: Date.now() - 2500000
  },
  {
    id: "item_seed_4",
    name: "Sabun Cair Lifebuoy 450ml",
    category: "Kebersihan & Mandi",
    unit: "botol",
    qty: 1,
    price: 24000,
    discountRaw: "50+20", // Tiered discount test!
    inTrolley: false,
    createdAt: Date.now() - 1500000
  }
];

const INITIAL_PAST_SESSIONS = [
  {
    id: "session_sep_2026",
    date: "28 September 2026",
    timestamp: 1759050000000,
    totalSpent: 428000,
    budgetLimit: 500000,
    totalSaved: 46000,
    itemCount: 9,
    items: [
      { name: "Beras Ramos 5kg", qty: 1, unit: "pack", price: 69000, category: "Bahan Pokok" },
      { name: "Minyak Goreng Sania 2L", qty: 1, unit: "liter", price: 34000, category: "Bahan Pokok" },
      { name: "Telur Ayam 1kg", qty: 2, unit: "kg", price: 28500, category: "Protein & Sayur" },
      { name: "Indomie Goreng (isi 5)", qty: 3, unit: "pack", price: 15500, category: "Bahan Pokok" },
      { name: "Deterjen Rinso 770g", qty: 1, unit: "pack", price: 23000, category: "Kebersihan & Mandi" },
      { name: "Susu UHT Ultra Milk 1L", qty: 2, unit: "liter", price: 19500, category: "Minuman & Snack" }
    ]
  }
];

// ================= APPLICATION STATE =================
class GroceryStore {
  constructor() {
    this.STORAGE_KEY = 'smart_grocery_app_state_v1';
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse stored state, falling back to seed.', e);
    }
    return {
      budgetLimit: 500000, // Rp 500.000 default budget for college student
      soundEnabled: true,
      activeCategory: 'ALL',
      searchQuery: '',
      sortMode: 'default', // 'default' | 'price-desc' | 'price-asc' | 'trolley'
      cart: INITIAL_ACTIVE_CART,
      priceDatabase: INITIAL_BENCHMARK_PRICES,
      historySessions: INITIAL_PAST_SESSIONS
    };
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  resetToDefault() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = {
      budgetLimit: 500000,
      soundEnabled: true,
      activeCategory: 'ALL',
      searchQuery: '',
      sortMode: 'default',
      cart: JSON.parse(JSON.stringify(INITIAL_ACTIVE_CART)),
      priceDatabase: JSON.parse(JSON.stringify(INITIAL_BENCHMARK_PRICES)),
      historySessions: JSON.parse(JSON.stringify(INITIAL_PAST_SESSIONS))
    };
    this.saveState();
  }
}

const store = new GroceryStore();

// ================= MATH & HELPER UTILITIES =================

/**
 * Format currency to Indonesian Rupiah standard format
 */
function formatRupiah(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Normalize string for price lookup comparison
 */
function normalizeKey(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * SRS F-03: Tiered Discount Calculation Engine
 * Handles single discount (e.g. "20%") and tiered compound discount (e.g. "50+20" or "50% + 20%")
 * Formula: Price * (1 - d1/100) * (1 - d2/100) ...
 */
function parseAndCalculateDiscount(basePrice, discountString) {
  const price = Math.max(0, parseFloat(basePrice) || 0);
  if (!discountString || typeof discountString !== 'string') {
    return {
      hasDiscount: false,
      tiers: [],
      effectivePct: 0,
      discountAmount: 0,
      finalUnitPrice: price,
      breakdownText: '',
      rawInput: ''
    };
  }

  const clean = discountString.replace(/%/g, '').trim();
  if (!clean) {
    return {
      hasDiscount: false,
      tiers: [],
      effectivePct: 0,
      discountAmount: 0,
      finalUnitPrice: price,
      breakdownText: '',
      rawInput: discountString
    };
  }

  // Parse tiers split by '+' or '/' or ','
  const parts = clean.split(/[+,/]/).map(p => parseFloat(p.trim())).filter(p => !isNaN(p) && p > 0);
  if (parts.length === 0) {
    return {
      hasDiscount: false,
      tiers: [],
      effectivePct: 0,
      discountAmount: 0,
      finalUnitPrice: price,
      breakdownText: '',
      rawInput: discountString
    };
  }

  // Calculate compound remaining factor
  let remainingFactor = 1.0;
  const stepPrices = [];
  let currentP = price;

  for (const disc of parts) {
    const cappedDisc = Math.min(100, Math.max(0, disc));
    remainingFactor *= (1 - cappedDisc / 100);
    currentP = currentP * (1 - cappedDisc / 100);
    stepPrices.push({ pct: cappedDisc, intermediatePrice: currentP });
  }

  const finalUnitPrice = Math.round(price * remainingFactor);
  const discountAmount = price - finalUnitPrice;
  const effectivePct = Math.round((1 - remainingFactor) * 100);

  // Generate breakdown explanation
  let breakdownText = '';
  if (parts.length > 1) {
    let stepsStr = `Rp ${Math.round(price).toLocaleString('id-ID')}`;
    let accum = price;
    parts.forEach((d) => {
      accum = accum * (1 - d / 100);
      stepsStr += ` ➔ -${d}% (${formatRupiah(accum)})`;
    });
    breakdownText = stepsStr;
  } else {
    breakdownText = `Diskon ${parts[0]}% (-${formatRupiah(discountAmount)})`;
  }

  return {
    hasDiscount: discountAmount > 0,
    tiers: parts,
    effectivePct,
    discountAmount,
    finalUnitPrice,
    breakdownText,
    rawInput: discountString
  };
}

/**
 * SRS F-04: Realtime Price Comparator vs Last Month Benchmark
 * Returns visual status: 'UP', 'DOWN', 'EQUAL', 'NEW'
 */
function comparePriceWithBenchmark(productName, currentUnitPrice) {
  const normKey = normalizeKey(productName);
  const db = store.state.priceDatabase;
  const currPrice = parseFloat(currentUnitPrice) || 0;

  // Direct or fuzzy match in price database
  let match = db[normKey];
  if (!match) {
    // Try finding by inclusion
    for (const key in db) {
      if (key.includes(normKey) || normKey.includes(key)) {
        match = db[key];
        break;
      }
    }
  }

  if (!match || match.pastPrice === undefined || match.pastPrice === null) {
    return {
      status: 'NEW',
      symbol: '🆕',
      text: 'Baru',
      diffAmount: 0,
      diffPct: 0,
      pastPrice: null,
      tooltip: 'Item baru, belum ada data pembanding bulan lalu'
    };
  }

  const pastPrice = match.pastPrice;
  const diffAmount = currPrice - pastPrice;

  if (currPrice > pastPrice) {
    const pct = Math.round((diffAmount / pastPrice) * 100);
    return {
      status: 'UP',
      symbol: '↑',
      text: `↑ +${formatRupiah(diffAmount)} (+${pct}%)`,
      diffAmount,
      diffPct: pct,
      pastPrice,
      tooltip: `Harga naik dibanding bulan lalu (${formatRupiah(pastPrice)})`
    };
  } else if (currPrice < pastPrice) {
    const diffAbs = Math.abs(diffAmount);
    const pct = Math.round((diffAbs / pastPrice) * 100);
    return {
      status: 'DOWN',
      symbol: '↓',
      text: `↓ -${formatRupiah(diffAbs)} (-${pct}%)`,
      diffAmount,
      diffPct: -pct,
      pastPrice,
      tooltip: `Harga lebih hemat dibanding bulan lalu (${formatRupiah(pastPrice)})`
    };
  } else {
    return {
      status: 'EQUAL',
      symbol: '=',
      text: `= Stabil`,
      diffAmount: 0,
      diffPct: 0,
      pastPrice,
      tooltip: `Harga sama stabil dengan bulan lalu (${formatRupiah(pastPrice)})`
    };
  }
}

// ================= AUDIO & HAPTIC SYNTHESIZER =================
class AudioFeedbackEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playSuccess() {
    if (!store.state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}

    if (navigator.vibrate) {
      navigator.vibrate([25]);
    }
  }

  playWarning() {
    if (!store.state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(370, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}

    if (navigator.vibrate) {
      navigator.vibrate([40, 50, 40]);
    }
  }

  playDanger() {
    if (!store.state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}

    if (navigator.vibrate) {
      navigator.vibrate([100, 60, 100]);
    }
  }
}

const audioEngine = new AudioFeedbackEngine();

// ================= UI RENDERING & CONTROLLERS =================

class AppController {
  constructor() {
    this.activeTab = 'viewBelanja';
    this.activeHistorySubTab = 'subPanelSessions';
    this.editingItemId = null;
    this.prevSafetyState = 'SAFE';

    this.cacheDom();
    this.initEventListeners();
    this.startClock();
    this.renderAll();
    this.initPWA();
    this.initFirebaseSync();
  }

  cacheDom() {
    // Status & Clock
    this.statusClock = document.getElementById('statusClock');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIcon = document.getElementById('soundIcon');
    this.quickAddHeaderBtn = document.getElementById('quickAddHeaderBtn');

    // Safety Cap Header Elements (F-05)
    this.safetyCapCard = document.getElementById('safetyCapCard');
    this.budgetLimitTrigger = document.getElementById('budgetLimitTrigger');
    this.displayBudgetLimit = document.getElementById('displayBudgetLimit');
    this.displayTotalBelanja = document.getElementById('displayTotalBelanja');
    this.displaySisaSaldo = document.getElementById('displaySisaSaldo');
    this.safetyProgressBar = document.getElementById('safetyProgressBar');
    this.displayProgressPct = document.getElementById('displayProgressPct');
    this.displayItemCount = document.getElementById('displayItemCount');
    this.safetyStatusBadge = document.getElementById('safetyStatusBadge');
    this.safetyStatusText = document.getElementById('safetyStatusText');
    this.safetyWarningBanner = document.getElementById('safetyWarningBanner');
    this.btnInspectExpensive = document.getElementById('btnInspectExpensive');

    // View Panels
    this.viewPanels = {
      viewBelanja: document.getElementById('viewBelanja'),
      viewRiwayat: document.getElementById('viewRiwayat'),
      viewAnggaran: document.getElementById('viewAnggaran')
    };

    // Bottom Navigation
    this.navBtns = {
      viewBelanja: document.getElementById('navBtnBelanja'),
      viewRiwayat: document.getElementById('navBtnRiwayat'),
      viewAnggaran: document.getElementById('navBtnAnggaran')
    };
    this.navBtnFabAdd = document.getElementById('navBtnFabAdd');
    this.navCartBadge = document.getElementById('navCartBadge');

    // Trolley View Controls
    this.categoryFilterStrip = document.getElementById('categoryFilterStrip');
    this.cartSearchInput = document.getElementById('cartSearchInput');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');
    this.sortToggleBtn = document.getElementById('sortToggleBtn');
    this.trolleySummaryText = document.getElementById('trolleySummaryText');
    this.btnToggleAllInCart = document.getElementById('btnToggleAllInCart');
    this.btnClearCartPrompt = document.getElementById('btnClearCartPrompt');
    this.groceryCardsList = document.getElementById('groceryCardsList');
    this.emptyCartState = document.getElementById('emptyCartState');
    this.btnEmptyAdd = document.getElementById('btnEmptyAdd');
    this.btnCheckoutTrip = document.getElementById('btnCheckoutTrip');

    // History Sub-tabs
    this.tabSubHistorySessions = document.getElementById('tabSubHistorySessions');
    this.tabSubPriceDatabase = document.getElementById('tabSubPriceDatabase');
    this.subPanelSessions = document.getElementById('subPanelSessions');
    this.subPanelPrices = document.getElementById('subPanelPrices');
    this.historySessionsList = document.getElementById('historySessionsList');
    this.priceDbList = document.getElementById('priceDbList');
    this.priceDbSearchInput = document.getElementById('priceDbSearchInput');

    // Budget Center (F-05 View)
    this.inputBudgetLimit = document.getElementById('inputBudgetLimit');
    this.btnSaveBudgetLimit = document.getElementById('btnSaveBudgetLimit');
    this.categoryBreakdownList = document.getElementById('categoryBreakdownList');
    this.btnExportData = document.getElementById('btnExportData');
    this.btnResetDefaultData = document.getElementById('btnResetDefaultData');

    // Item Add/Edit Modal Form
    this.itemModalBackdrop = document.getElementById('itemModalBackdrop');
    this.itemModalSheet = document.getElementById('itemModalSheet');
    this.itemModalTitle = document.getElementById('itemModalTitle');
    this.btnItemModalClose = document.getElementById('btnItemModalClose');
    this.btnModalCancel = document.getElementById('btnModalCancel');
    this.itemForm = document.getElementById('itemForm');
    this.itemIdInput = document.getElementById('itemIdInput');
    this.inputItemName = document.getElementById('inputItemName');
    this.quickSuggestionsRow = document.getElementById('quickSuggestionsRow');
    this.selectItemCategory = document.getElementById('selectItemCategory');
    this.selectItemUnit = document.getElementById('selectItemUnit');
    this.inputItemPrice = document.getElementById('inputItemPrice');
    this.liveComparatorPill = document.getElementById('liveComparatorPill');
    this.pastPriceHint = document.getElementById('pastPriceHint');
    this.pastPriceHintText = document.getElementById('pastPriceHintText');
    this.inputItemQty = document.getElementById('inputItemQty');
    this.btnModalQtyMinus = document.getElementById('btnModalQtyMinus');
    this.btnModalQtyPlus = document.getElementById('btnModalQtyPlus');
    this.inputItemDiscount = document.getElementById('inputItemDiscount');
    this.btnClearDiscount = document.getElementById('btnClearDiscount');
    this.discountResultCallout = document.getElementById('discountResultCallout');
    this.calloutDiscountTitle = document.getElementById('calloutDiscountTitle');
    this.calloutDiscountMath = document.getElementById('calloutDiscountMath');
    this.badgeEffectivePct = document.getElementById('badgeEffectivePct');
    this.badgeTotalSaved = document.getElementById('badgeTotalSaved');
    this.lineCalcFormula = document.getElementById('lineCalcFormula');
    this.lineCalcTotal = document.getElementById('lineCalcTotal');
    this.btnModalSubmit = document.getElementById('btnModalSubmit');

    // Quick Budget Modal
    this.budgetModalBackdrop = document.getElementById('budgetModalBackdrop');
    this.quickBudgetInput = document.getElementById('quickBudgetInput');
    this.btnQuickBudgetCancel = document.getElementById('btnQuickBudgetCancel');
    this.btnQuickBudgetSave = document.getElementById('btnQuickBudgetSave');

    // Checkout Confirmation Modal
    this.checkoutModalBackdrop = document.getElementById('checkoutModalBackdrop');
    this.checkoutModalTotal = document.getElementById('checkoutModalTotal');
    this.checkoutModalCount = document.getElementById('checkoutModalCount');
    this.checkoutModalSavings = document.getElementById('checkoutModalSavings');
    this.checkoutModalRemaining = document.getElementById('checkoutModalRemaining');
    this.btnCheckoutCancel = document.getElementById('btnCheckoutCancel');
    this.btnCheckoutConfirm = document.getElementById('btnCheckoutConfirm');

    // History Detail Modal
    this.historyDetailModalBackdrop = document.getElementById('historyDetailModalBackdrop');
    this.btnHistoryDetailClose = document.getElementById('btnHistoryDetailClose');
    this.historyDetailTitle = document.getElementById('historyDetailTitle');
    this.historyDetailDate = document.getElementById('historyDetailDate');
    this.historyDetailTotal = document.getElementById('historyDetailTotal');
    this.historyDetailLimit = document.getElementById('historyDetailLimit');
    this.historyDetailSaved = document.getElementById('historyDetailSaved');
    this.historyDetailItemsList = document.getElementById('historyDetailItemsList');

    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');

    // Firebase Elements (SRS F-06)
    this.cloudStatusChip = document.getElementById('cloudStatusChip');
    this.cloudStatusText = document.getElementById('cloudStatusText');
    this.cloudDot = document.getElementById('cloudDot');
    this.firebaseStatusBanner = document.getElementById('firebaseStatusBanner');
    this.firebaseStatusTitle = document.getElementById('firebaseStatusTitle');
    this.firebaseStatusSubtitle = document.getElementById('firebaseStatusSubtitle');
    this.firebaseDot = document.getElementById('firebaseDot');
    this.btnSyncFirebase = document.getElementById('btnSyncFirebase');
    this.btnDownloadFirebase = document.getElementById('btnDownloadFirebase');
    this.btnOpenFirebaseModal = document.getElementById('btnOpenFirebaseModal');
    this.firebaseModalBackdrop = document.getElementById('firebaseModalBackdrop');
    this.btnFirebaseModalClose = document.getElementById('btnFirebaseModalClose');
    this.btnFirebaseModalClear = document.getElementById('btnFirebaseModalClear');
    this.btnFirebaseModalSave = document.getElementById('btnFirebaseModalSave');
    this.inputFirebaseJson = document.getElementById('inputFirebaseJson');
    this.inputFirebaseApiKey = document.getElementById('inputFirebaseApiKey');
    this.inputFirebaseProjectId = document.getElementById('inputFirebaseProjectId');
    this.inputFirebaseAuthDomain = document.getElementById('inputFirebaseAuthDomain');
    this.inputFirebaseAppId = document.getElementById('inputFirebaseAppId');
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      if (this.statusClock) {
        this.statusClock.textContent = `${hours}:${mins}`;
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  initEventListeners() {
    // Sound Toggle
    this.soundToggleBtn.addEventListener('click', () => {
      store.state.soundEnabled = !store.state.soundEnabled;
      store.saveState();
      this.updateSoundButton();
      this.showToast(store.state.soundEnabled ? 'Suara & Haptik Aktif' : 'Suara Dimatikan', 'info');
    });

    // Navigation Switcher
    Object.keys(this.navBtns).forEach(targetView => {
      this.navBtns[targetView].addEventListener('click', () => {
        this.switchTab(targetView);
      });
    });

    // FAB & Header Add Buttons
    this.navBtnFabAdd.addEventListener('click', () => this.openItemModal());
    this.quickAddHeaderBtn.addEventListener('click', () => this.openItemModal());
    this.btnEmptyAdd.addEventListener('click', () => this.openItemModal());

    // Budget Limit Quick Triggers
    this.budgetLimitTrigger.addEventListener('click', () => this.openQuickBudgetModal());

    // Search and Filters
    this.cartSearchInput.addEventListener('input', (e) => {
      store.state.searchQuery = e.target.value.toLowerCase().trim();
      this.clearSearchBtn.classList.toggle('hidden', !e.target.value);
      this.renderCartItems();
    });

    this.clearSearchBtn.addEventListener('click', () => {
      this.cartSearchInput.value = '';
      store.state.searchQuery = '';
      this.clearSearchBtn.classList.add('hidden');
      this.renderCartItems();
    });

    // Category Filter Chips
    this.categoryFilterStrip.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      const cat = chip.dataset.category;
      store.state.activeCategory = cat;
      this.categoryFilterStrip.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.renderCartItems();
    });

    // Sort Toggle
    this.sortToggleBtn.addEventListener('click', () => {
      const modes = ['default', 'price-desc', 'price-asc', 'trolley'];
      const nextIdx = (modes.indexOf(store.state.sortMode) + 1) % modes.length;
      store.state.sortMode = modes[nextIdx];
      const labels = {
        'default': 'Urutan Default',
        'price-desc': 'Harga Termahal ➔ Termurah',
        'price-asc': 'Harga Termurah ➔ Termahal',
        'trolley': 'Troli Tercentang Duluan'
      };
      this.showToast(`Urutkan: ${labels[store.state.sortMode]}`, 'info');
      this.renderCartItems();
    });

    // Trolley bulk actions
    this.btnToggleAllInCart.addEventListener('click', () => {
      const allIn = store.state.cart.every(i => i.inTrolley);
      store.state.cart.forEach(i => i.inTrolley = !allIn);
      store.saveState();
      this.renderAll();
      this.showToast(!allIn ? 'Semua item ditandai masuk troli' : 'Semua item batal troli', 'info');
    });

    this.btnClearCartPrompt.addEventListener('click', () => {
      if (store.state.cart.length === 0) return;
      if (confirm('Kosongkan semua daftar belanjaan saat ini?')) {
        store.state.cart = [];
        store.saveState();
        this.renderAll();
        this.showToast('Keranjang belanja dikosongkan', 'info');
      }
    });

    // History Sub-tabs
    this.tabSubHistorySessions.addEventListener('click', () => this.switchHistorySubTab('subPanelSessions'));
    this.tabSubPriceDatabase.addEventListener('click', () => this.switchHistorySubTab('subPanelPrices'));
    this.priceDbSearchInput.addEventListener('input', () => this.renderPriceDatabase());

    // Budget Center Limit save
    this.btnSaveBudgetLimit.addEventListener('click', () => {
      const val = parseFloat(this.inputBudgetLimit.value);
      if (val && val > 0) {
        store.state.budgetLimit = val;
        store.saveState();
        this.renderBudgetAndSafetyGauge();
        this.showToast(`Batas anggaran diperbarui: ${formatRupiah(val)}`, 'success');
        audioEngine.playSuccess();
      }
    });

    // Quick Budget Chips in Settings
    document.querySelectorAll('.budget-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const val = parseFloat(e.currentTarget.dataset.val);
        if (val) {
          if (this.inputBudgetLimit) this.inputBudgetLimit.value = val;
          if (this.quickBudgetInput) this.quickBudgetInput.value = val;
        }
      });
    });

    // Export & Reset
    this.btnExportData.addEventListener('click', () => this.exportJsonData());
    this.btnResetDefaultData.addEventListener('click', () => {
      if (confirm('Muat ulang data contoh awal untuk demo? Data perubahan akan direset.')) {
        store.resetToDefault();
        this.renderAll();
        this.showToast('Data contoh berhasil dimuat!', 'success');
      }
    });

    // Checkout Flow
    this.btnCheckoutTrip.addEventListener('click', () => this.openCheckoutModal());
    this.btnCheckoutCancel.addEventListener('click', () => this.closeCheckoutModal());
    this.btnCheckoutConfirm.addEventListener('click', () => this.handleCheckoutConfirm());

    // Firebase Cloud Sync Listeners (SRS F-06)
    if (this.btnSyncFirebase) {
      this.btnSyncFirebase.addEventListener('click', () => this.handleSyncToFirebase());
    }
    if (this.btnDownloadFirebase) {
      this.btnDownloadFirebase.addEventListener('click', () => this.handleDownloadFromFirebase());
    }
    if (this.btnOpenFirebaseModal) {
      this.btnOpenFirebaseModal.addEventListener('click', () => this.openFirebaseModal());
    }
    if (this.cloudStatusChip) {
      this.cloudStatusChip.addEventListener('click', () => this.openFirebaseModal());
    }
    if (this.btnFirebaseModalClose) {
      this.btnFirebaseModalClose.addEventListener('click', () => this.closeFirebaseModal());
    }
    if (this.btnFirebaseModalClear) {
      this.btnFirebaseModalClear.addEventListener('click', () => this.clearFirebaseConfig());
    }
    if (this.btnFirebaseModalSave) {
      this.btnFirebaseModalSave.addEventListener('click', () => this.saveFirebaseConfig());
    }
    if (this.firebaseModalBackdrop) {
      this.firebaseModalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.firebaseModalBackdrop) this.closeFirebaseModal();
      });
    }
    if (this.inputFirebaseJson) {
      this.inputFirebaseJson.addEventListener('input', (e) => this.handleFirebaseJsonPaste(e.target.value));
    }

    // Inspect Expensive Items Shortcut
    this.btnInspectExpensive.addEventListener('click', () => {
      store.state.sortMode = 'price-desc';
      this.switchTab('viewBelanja');
      this.renderCartItems();
      this.showToast('Belanjaan diurutkan dari harga termahal', 'info');
    });

    // Modal Close Triggers
    this.btnItemModalClose.addEventListener('click', () => this.closeItemModal());
    this.btnModalCancel.addEventListener('click', () => this.closeItemModal());
    this.itemModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.itemModalBackdrop) this.closeItemModal();
    });

    this.btnQuickBudgetCancel.addEventListener('click', () => this.closeQuickBudgetModal());
    this.btnQuickBudgetSave.addEventListener('click', () => this.saveQuickBudget());
    this.budgetModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.budgetModalBackdrop) this.closeQuickBudgetModal();
    });

    this.btnHistoryDetailClose.addEventListener('click', () => this.closeHistoryDetailModal());
    this.historyDetailModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.historyDetailModalBackdrop) this.closeHistoryDetailModal();
    });

    // Item Form Reactive Listeners (F-01, F-02, F-03, F-04)
    this.inputItemName.addEventListener('input', () => this.handleModalNameOrPriceChange());
    this.inputItemPrice.addEventListener('input', () => this.handleModalNameOrPriceChange());
    this.inputItemQty.addEventListener('input', () => this.handleModalQtyChange());
    this.inputItemDiscount.addEventListener('input', () => this.handleModalDiscountChange());

    // Stepper Thumb Buttons
    this.btnModalQtyMinus.addEventListener('click', () => {
      let q = parseInt(this.inputItemQty.value, 10) || 1;
      if (q > 1) {
        this.inputItemQty.value = q - 1;
        this.handleModalQtyChange();
      }
    });
    this.btnModalQtyPlus.addEventListener('click', () => {
      let q = parseInt(this.inputItemQty.value, 10) || 1;
      this.inputItemQty.value = q + 1;
      this.handleModalQtyChange();
    });

    // Quick Qty Preset Chips
    document.querySelectorAll('.chip-qty-opt').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const q = parseInt(e.currentTarget.dataset.q, 10);
        this.inputItemQty.value = q;
        this.handleModalQtyChange();
      });
    });

    // Discount Presets
    document.querySelectorAll('.discount-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const disc = e.currentTarget.dataset.disc;
        this.inputItemDiscount.value = disc === '0' ? '' : disc;
        this.handleModalDiscountChange();
      });
    });
    this.btnClearDiscount.addEventListener('click', () => {
      this.inputItemDiscount.value = '';
      this.handleModalDiscountChange();
    });

    // Item Form Submit
    this.itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleItemFormSubmit();
    });
  }

  // ================= NAVIGATION =================
  switchTab(targetViewId) {
    this.activeTab = targetViewId;
    Object.keys(this.viewPanels).forEach(key => {
      this.viewPanels[key].classList.toggle('active', key === targetViewId);
      if (this.navBtns[key]) {
        this.navBtns[key].classList.toggle('active', key === targetViewId);
      }
    });

    if (targetViewId === 'viewRiwayat') {
      this.renderHistorySessions();
      this.renderPriceDatabase();
    } else if (targetViewId === 'viewAnggaran') {
      this.renderBudgetCenter();
    }
    this.refreshIcons();
  }

  switchHistorySubTab(subTabId) {
    this.activeHistorySubTab = subTabId;
    this.tabSubHistorySessions.classList.toggle('active', subTabId === 'subPanelSessions');
    this.tabSubPriceDatabase.classList.toggle('active', subTabId === 'subPanelPrices');
    this.subPanelSessions.classList.toggle('active', subTabId === 'subPanelSessions');
    this.subPanelPrices.classList.toggle('active', subTabId === 'subPanelPrices');
    this.refreshIcons();
  }

  updateSoundButton() {
    const enabled = store.state.soundEnabled;
    this.soundToggleBtn.classList.toggle('active', enabled);
    this.soundIcon.setAttribute('data-lucide', enabled ? 'volume-2' : 'volume-x');
    this.refreshIcons();
  }

  // ================= SRS F-05: BUDGET SAFETY CAP CONTROLLER =================
  renderBudgetAndSafetyGauge() {
    const limit = store.state.budgetLimit;
    const cart = store.state.cart;

    // Calculate total spend and total discount savings
    let totalCartPrice = 0;
    let totalOriginalPrice = 0;
    let inTrolleyCount = 0;

    cart.forEach(item => {
      const qty = item.qty || 1;
      const price = item.price || 0;
      const disc = parseAndCalculateDiscount(price, item.discountRaw);
      
      totalOriginalPrice += (price * qty);
      totalCartPrice += (disc.finalUnitPrice * qty);

      if (item.inTrolley) {
        inTrolleyCount++;
      }
    });

    const totalSavings = totalOriginalPrice - totalCartPrice;
    const remaining = limit - totalCartPrice;
    const pct = limit > 0 ? (totalCartPrice / limit) * 100 : 0;
    const clampedWidth = Math.min(100, Math.max(0, pct));

    // Update DOM
    this.displayBudgetLimit.textContent = formatRupiah(limit);
    this.displayTotalBelanja.textContent = formatRupiah(totalCartPrice);
    this.displaySisaSaldo.textContent = remaining >= 0 ? formatRupiah(remaining) : `-${formatRupiah(Math.abs(remaining))}`;
    
    if (remaining < 0) {
      this.displaySisaSaldo.style.color = 'var(--status-danger)';
    } else {
      this.displaySisaSaldo.style.color = 'var(--text-main)';
    }

    this.safetyProgressBar.style.width = `${clampedWidth}%`;
    this.displayProgressPct.textContent = `${Math.round(pct)}% Terpakai`;
    this.displayItemCount.textContent = `${cart.length} Item (${inTrolleyCount} di Troli)`;
    this.navCartBadge.textContent = cart.length;

    // Determine Safety State:
    // Green (Safe < 75%)
    // Amber (Warning 75% - 90%)
    // Crimson (Danger / Overbudget > 90% and > 100%)
    this.safetyCapCard.classList.remove('state-safe', 'state-warn', 'state-danger');

    let currentState = 'SAFE';
    if (pct < 75) {
      currentState = 'SAFE';
      this.safetyCapCard.classList.add('state-safe');
      this.safetyStatusText.textContent = 'Kondisi Aman';
      this.safetyWarningBanner.classList.add('hidden');
    } else if (pct <= 90) {
      currentState = 'WARN';
      this.safetyCapCard.classList.add('state-warn');
      this.safetyStatusText.textContent = 'Waspada Mendekati Limit';
      this.safetyWarningBanner.classList.remove('hidden');
      document.getElementById('warnTitle').textContent = 'Mendekati Batas Dompet!';
      document.getElementById('warnSubtitle').textContent = `Tersisa ${formatRupiah(remaining)}. Cek kembali barang yang belum mendesak.`;
    } else {
      currentState = 'DANGER';
      this.safetyCapCard.classList.add('state-danger');
      if (pct > 100) {
        this.safetyStatusText.textContent = '⚠️ OVERBUDGET!';
        document.getElementById('warnTitle').textContent = '⚠️ Overbudget Melampaui Limit!';
        document.getElementById('warnSubtitle').textContent = `Defisit ${formatRupiah(Math.abs(remaining))}! Kurangi item sebelum ke kasir.`;
      } else {
        this.safetyStatusText.textContent = 'Batas Kritis (>90%)';
        document.getElementById('warnTitle').textContent = 'Peringatan Anggaran Kritis!';
        document.getElementById('warnSubtitle').textContent = `Sudah ${Math.round(pct)}% dari kuota bulanan terpakai!`;
      }
      this.safetyWarningBanner.classList.remove('hidden');
    }

    // Audio / Haptic alert if state worsened
    if (currentState !== this.prevSafetyState) {
      if (currentState === 'DANGER') {
        audioEngine.playDanger();
      } else if (currentState === 'WARN') {
        audioEngine.playWarning();
      }
      this.prevSafetyState = currentState;
    }

    // Update Checkout button subtitle
    const checkoutSub = document.getElementById('checkoutBtnSub');
    if (checkoutSub) {
      checkoutSub.textContent = `Total ${formatRupiah(totalCartPrice)} • Hemat ${formatRupiah(totalSavings)}`;
    }

    this.trolleySummaryText.textContent = `${inTrolleyCount} / ${cart.length} Masuk Troli`;
    this.emptyCartState.classList.toggle('hidden', cart.length > 0);
    this.refreshIcons();
  }

  // ================= CART ITEMS LIST (SRS F-01, F-02, F-04) =================
  renderCartItems() {
    let items = [...store.state.cart];

    // Filter by Category
    if (store.state.activeCategory !== 'ALL') {
      items = items.filter(i => i.category === store.state.activeCategory);
    }

    // Filter by Search Query
    if (store.state.searchQuery) {
      items = items.filter(i => i.name.toLowerCase().includes(store.state.searchQuery));
    }

    // Sorting
    if (store.state.sortMode === 'price-desc') {
      items.sort((a, b) => {
        const da = parseAndCalculateDiscount(a.price, a.discountRaw).finalUnitPrice * (a.qty || 1);
        const db = parseAndCalculateDiscount(b.price, b.discountRaw).finalUnitPrice * (b.qty || 1);
        return db - da;
      });
    } else if (store.state.sortMode === 'price-asc') {
      items.sort((a, b) => {
        const da = parseAndCalculateDiscount(a.price, a.discountRaw).finalUnitPrice * (a.qty || 1);
        const db = parseAndCalculateDiscount(b.price, b.discountRaw).finalUnitPrice * (b.qty || 1);
        return da - db;
      });
    } else if (store.state.sortMode === 'trolley') {
      items.sort((a, b) => (b.inTrolley ? 1 : 0) - (a.inTrolley ? 1 : 0));
    }

    this.groceryCardsList.innerHTML = '';

    if (items.length === 0 && store.state.cart.length > 0) {
      this.groceryCardsList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim); font-size: 13px;">
          Tidak ada item yang cocok dengan filter.
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = this.createItemCardElement(item);
      this.groceryCardsList.appendChild(card);
    });

    this.refreshIcons();
  }

  createItemCardElement(item) {
    const card = document.createElement('div');
    card.className = `item-card ${item.inTrolley ? 'in-trolley' : ''}`;
    card.dataset.id = item.id;

    // Calculate discount and line totals
    const disc = parseAndCalculateDiscount(item.price, item.discountRaw);
    const lineTotal = disc.finalUnitPrice * item.qty;

    // F-04: Realtime Price Comparator
    const comp = comparePriceWithBenchmark(item.name, item.price);

    let compBadgeHtml = '';
    if (comp.status === 'UP') {
      compBadgeHtml = `
        <span class="comp-badge price-up" title="${comp.tooltip}">
          <i data-lucide="arrow-up-right"></i> ${comp.text}
        </span>
      `;
    } else if (comp.status === 'DOWN') {
      compBadgeHtml = `
        <span class="comp-badge price-down" title="${comp.tooltip}">
          <i data-lucide="arrow-down-right"></i> ${comp.text}
        </span>
      `;
    } else if (comp.status === 'EQUAL') {
      compBadgeHtml = `
        <span class="comp-badge price-equal" title="${comp.tooltip}">
          <i data-lucide="equal"></i> ${comp.text}
        </span>
      `;
    } else {
      compBadgeHtml = `
        <span class="comp-badge price-new" title="${comp.tooltip}">
          <i data-lucide="sparkles"></i> Baru
        </span>
      `;
    }

    // F-03: Discount Badge
    let discountBadgeHtml = '';
    if (disc.hasDiscount) {
      discountBadgeHtml = `
        <span class="discount-chip-tag" title="${disc.breakdownText}">
          <i data-lucide="percent"></i> ${item.discountRaw} (Efektif ${disc.effectivePct}%)
        </span>
      `;
    }

    card.innerHTML = `
      <div class="item-card-top">
        <div class="trolley-checkbox-wrap">
          <div class="custom-checkbox ${item.inTrolley ? 'checked' : ''}" data-action="toggle-trolley">
            <i data-lucide="check"></i>
          </div>
        </div>
        <div class="item-info-main">
          <div class="item-tags-row">
            <span class="category-badge">${item.category || 'Bahan Pokok'}</span>
            <span class="unit-badge">${item.unit || 'pcs'}</span>
          </div>
          <h4 class="item-title" title="${item.name}">${item.name}</h4>
        </div>
        <div class="item-card-actions">
          <button class="btn-card-action" data-action="edit-item" title="Edit Item">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-card-action btn-del" data-action="delete-item" title="Hapus Item">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>

      <div class="item-card-middle">
        <span class="unit-price-text">${formatRupiah(item.price)}/${item.unit || 'pcs'}</span>
        ${compBadgeHtml}
        ${discountBadgeHtml}
      </div>

      <div class="item-card-bottom">
        <!-- Stepper Ergonomis untuk Jempol (SRS F-02) -->
        <div class="card-stepper">
          <button class="stepper-btn" data-action="qty-minus" aria-label="Kurangi">
            <i data-lucide="minus"></i>
          </button>
          <span class="stepper-val">${item.qty}</span>
          <button class="stepper-btn" data-action="qty-plus" aria-label="Tambah">
            <i data-lucide="plus"></i>
          </button>
        </div>

        <div class="item-line-total-box">
          <span class="line-total-caption">Total Item:</span>
          <span class="line-total-amount ${disc.hasDiscount ? 'has-discount' : ''}">${formatRupiah(lineTotal)}</span>
        </div>
      </div>
    `;

    // Event delegation on card
    card.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'toggle-trolley') {
        item.inTrolley = !item.inTrolley;
        store.saveState();
        this.renderAll();
        if (item.inTrolley) audioEngine.playSuccess();
      } else if (action === 'qty-minus') {
        if (item.qty > 1) {
          item.qty -= 1;
          store.saveState();
          this.renderAll();
        }
      } else if (action === 'qty-plus') {
        item.qty += 1;
        store.saveState();
        this.renderAll();
      } else if (action === 'edit-item') {
        this.openItemModal(item.id);
      } else if (action === 'delete-item') {
        this.deleteItem(item.id);
      }
    });

    return card;
  }

  deleteItem(id) {
    store.state.cart = store.state.cart.filter(i => i.id !== id);
    store.saveState();
    this.renderAll();
    this.showToast('Item berhasil dihapus dari daftar', 'info');
  }

  // ================= ITEM MODAL (SRS F-01, F-02, F-03, F-04) =================
  openItemModal(editId = null) {
    this.editingItemId = editId;
    this.itemForm.reset();
    this.discountResultCallout.classList.add('hidden');
    this.btnClearDiscount.classList.add('hidden');

    this.renderQuickSuggestions();

    if (editId) {
      const item = store.state.cart.find(i => i.id === editId);
      if (!item) return;
      this.itemModalTitle.textContent = 'Edit Item Belanja';
      this.itemIdInput.value = item.id;
      this.inputItemName.value = item.name;
      this.selectItemCategory.value = item.category || 'Bahan Pokok';
      this.selectItemUnit.value = item.unit || 'pcs';
      this.inputItemPrice.value = item.price;
      this.inputItemQty.value = item.qty || 1;
      this.inputItemDiscount.value = item.discountRaw || '';
      this.btnModalSubmit.innerHTML = `<i data-lucide="check"></i> Simpan Perubahan`;
    } else {
      this.itemModalTitle.textContent = 'Tambah Item Belanja';
      this.itemIdInput.value = '';
      this.inputItemQty.value = 1;
      this.btnModalSubmit.innerHTML = `<i data-lucide="shopping-cart"></i> Simpan ke Troli`;
    }

    this.handleModalNameOrPriceChange();
    this.handleModalDiscountChange();
    this.itemModalBackdrop.classList.remove('hidden');
    this.refreshIcons();

    setTimeout(() => {
      if (!editId) this.inputItemName.focus();
    }, 150);
  }

  closeItemModal() {
    this.itemModalBackdrop.classList.add('hidden');
    this.editingItemId = null;
  }

  renderQuickSuggestions() {
    this.quickSuggestionsRow.innerHTML = '';
    const db = store.state.priceDatabase;
    const suggestions = Object.values(db).slice(0, 8);

    suggestions.forEach(s => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sugg-chip';
      chip.textContent = s.name;
      chip.addEventListener('click', () => {
        this.inputItemName.value = s.name;
        this.selectItemCategory.value = s.category;
        this.selectItemUnit.value = s.unit;
        this.inputItemPrice.value = s.pastPrice;
        this.handleModalNameOrPriceChange();
      });
      this.quickSuggestionsRow.appendChild(chip);
    });
  }

  handleModalNameOrPriceChange() {
    const name = this.inputItemName.value;
    const price = parseFloat(this.inputItemPrice.value) || 0;

    // F-04 Live Comparator
    const comp = comparePriceWithBenchmark(name, price);

    this.liveComparatorPill.className = 'comparator-pill-live';
    if (comp.status === 'UP') {
      this.liveComparatorPill.classList.add('price-up');
      this.liveComparatorPill.innerHTML = `<i data-lucide="arrow-up-right"></i> ${comp.text}`;
      this.pastPriceHintText.textContent = `Bulan lalu: ${formatRupiah(comp.pastPrice)} (Naik ${formatRupiah(comp.diffAmount)})`;
    } else if (comp.status === 'DOWN') {
      this.liveComparatorPill.classList.add('price-down');
      this.liveComparatorPill.innerHTML = `<i data-lucide="arrow-down-right"></i> ${comp.text}`;
      this.pastPriceHintText.textContent = `Bulan lalu: ${formatRupiah(comp.pastPrice)} (Lebih hemat ${formatRupiah(Math.abs(comp.diffAmount))})`;
    } else if (comp.status === 'EQUAL') {
      this.liveComparatorPill.classList.add('price-equal');
      this.liveComparatorPill.innerHTML = `<i data-lucide="equal"></i> Stabil`;
      this.pastPriceHintText.textContent = `Harga sama persis dengan bulan lalu (${formatRupiah(comp.pastPrice)})`;
    } else {
      this.liveComparatorPill.classList.add('price-new');
      this.liveComparatorPill.innerHTML = `<i data-lucide="sparkles"></i> Baru`;
      this.pastPriceHintText.textContent = name ? 'Belum ada catatan harga bulan lalu untuk produk ini' : 'Ketik nama produk untuk cek harga bulan lalu';
    }

    this.calculateModalLineTotal();
    this.refreshIcons();
  }

  handleModalQtyChange() {
    this.calculateModalLineTotal();
  }

  handleModalDiscountChange() {
    const discStr = this.inputItemDiscount.value.trim();
    const price = parseFloat(this.inputItemPrice.value) || 0;
    this.btnClearDiscount.classList.toggle('hidden', !discStr);

    const disc = parseAndCalculateDiscount(price, discStr);

    if (disc.hasDiscount) {
      this.discountResultCallout.classList.remove('hidden');
      if (disc.tiers.length > 1) {
        this.calloutDiscountTitle.textContent = `Diskon Bertingkat: ${disc.tiers.join('% + ')}%`;
      } else {
        this.calloutDiscountTitle.textContent = `Diskon Tunggal: ${disc.tiers[0]}%`;
      }
      this.calloutDiscountMath.textContent = disc.breakdownText;
      this.badgeEffectivePct.textContent = `Efektif: ${disc.effectivePct}%`;
      this.badgeTotalSaved.textContent = `Hemat: ${formatRupiah(disc.discountAmount * (parseInt(this.inputItemQty.value, 10) || 1))}`;
    } else {
      this.discountResultCallout.classList.add('hidden');
    }

    this.calculateModalLineTotal();
    this.refreshIcons();
  }

  calculateModalLineTotal() {
    const qty = parseInt(this.inputItemQty.value, 10) || 1;
    const price = parseFloat(this.inputItemPrice.value) || 0;
    const discStr = this.inputItemDiscount.value.trim();
    const disc = parseAndCalculateDiscount(price, discStr);

    const total = disc.finalUnitPrice * qty;
    this.lineCalcFormula.textContent = `${qty} x ${formatRupiah(disc.finalUnitPrice)}${disc.hasDiscount ? ` (Awal ${formatRupiah(price)})` : ''}`;
    this.lineCalcTotal.textContent = formatRupiah(total);
  }

  handleItemFormSubmit() {
    const name = this.inputItemName.value.trim();
    const price = parseFloat(this.inputItemPrice.value);
    const qty = parseInt(this.inputItemQty.value, 10) || 1;
    const category = this.selectItemCategory.value;
    const unit = this.selectItemUnit.value;
    const discountRaw = this.inputItemDiscount.value.trim();

    if (!name) {
      alert('Mohon isi nama produk!');
      return;
    }
    if (isNaN(price) || price < 0) {
      alert('Mohon isi harga satuan dengan angka valid!');
      return;
    }

    if (this.editingItemId) {
      // Update item
      const item = store.state.cart.find(i => i.id === this.editingItemId);
      if (item) {
        item.name = name;
        item.price = price;
        item.qty = qty;
        item.category = category;
        item.unit = unit;
        item.discountRaw = discountRaw;
        store.saveState();
        this.showToast('Item berhasil diperbarui!', 'success');
      }
    } else {
      // Add new item
      const newItem = {
        id: 'item_' + Date.now(),
        name,
        price,
        qty,
        category,
        unit,
        discountRaw,
        inTrolley: true,
        createdAt: Date.now()
      };
      store.state.cart.push(newItem);
      store.saveState();
      this.showToast(`${name} ditambahkan ke troli!`, 'success');
      audioEngine.playSuccess();
    }

    this.closeItemModal();
    this.renderAll();
  }

  // ================= QUICK BUDGET MODAL =================
  openQuickBudgetModal() {
    this.quickBudgetInput.value = store.state.budgetLimit;
    this.budgetModalBackdrop.classList.remove('hidden');
    setTimeout(() => this.quickBudgetInput.focus(), 150);
  }

  closeQuickBudgetModal() {
    this.budgetModalBackdrop.classList.add('hidden');
  }

  saveQuickBudget() {
    const val = parseFloat(this.quickBudgetInput.value);
    if (val && val > 0) {
      store.state.budgetLimit = val;
      store.saveState();
      this.closeQuickBudgetModal();
      this.renderAll();
      this.showToast(`Batas anggaran diatur ke ${formatRupiah(val)}`, 'success');
      audioEngine.playSuccess();
    }
  }

  // ================= CHECKOUT / SELESAIKAN BELANJA (SRS F-06) =================
  openCheckoutModal() {
    if (store.state.cart.length === 0) {
      this.showToast('Troli belanja masih kosong!', 'info');
      return;
    }

    let totalSpend = 0;
    let totalNormal = 0;
    let totalItems = 0;

    store.state.cart.forEach(item => {
      const qty = item.qty || 1;
      const disc = parseAndCalculateDiscount(item.price, item.discountRaw);
      totalNormal += item.price * qty;
      totalSpend += disc.finalUnitPrice * qty;
      totalItems += qty;
    });

    const savings = totalNormal - totalSpend;
    const remaining = store.state.budgetLimit - totalSpend;

    this.checkoutModalTotal.textContent = formatRupiah(totalSpend);
    this.checkoutModalCount.textContent = `${totalItems} pcs (${store.state.cart.length} macam barang)`;
    this.checkoutModalSavings.textContent = formatRupiah(savings);
    this.checkoutModalRemaining.textContent = remaining >= 0 ? formatRupiah(remaining) : `Defisit ${formatRupiah(Math.abs(remaining))}`;

    this.checkoutModalBackdrop.classList.remove('hidden');
  }

  closeCheckoutModal() {
    this.checkoutModalBackdrop.classList.add('hidden');
  }

  handleCheckoutConfirm() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let totalSpend = 0;
    let totalNormal = 0;
    let totalItems = 0;

    const sessionItems = store.state.cart.map(item => {
      const qty = item.qty || 1;
      const disc = parseAndCalculateDiscount(item.price, item.discountRaw);
      totalNormal += item.price * qty;
      totalSpend += disc.finalUnitPrice * qty;
      totalItems += qty;

      // Update benchmark database (F-06): This month's price becomes official benchmark
      const key = normalizeKey(item.name);
      store.state.priceDatabase[key] = {
        name: item.name,
        category: item.category,
        unit: item.unit,
        pastPrice: item.price, // unit price recorded
        lastUpdated: dateStr
      };

      return {
        name: item.name,
        category: item.category,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        discountRaw: item.discountRaw,
        finalUnitPrice: disc.finalUnitPrice,
        lineTotal: disc.finalUnitPrice * qty
      };
    });

    const savings = totalNormal - totalSpend;

    const newSession = {
      id: 'session_' + Date.now(),
      date: dateStr,
      timestamp: Date.now(),
      totalSpent: totalSpend,
      budgetLimit: store.state.budgetLimit,
      totalSaved: savings,
      itemCount: totalItems,
      items: sessionItems
    };

    // Prepend to history sessions
    store.state.historySessions.unshift(newSession);

    // Empty active cart for next trip
    store.state.cart = [];
    store.saveState();

    // Auto-sync trip to Firebase if connected
    if (window.firebaseSyncService && window.firebaseSyncService.isConfigured()) {
      window.firebaseSyncService.uploadAllData(store.state).then(() => {
        console.log('Trip session auto-synced to Firebase');
      }).catch(err => {
        console.warn('Auto-sync notice:', err);
      });
    }

    this.closeCheckoutModal();
    this.switchTab('viewRiwayat');
    this.renderAll();
    this.showToast('Selesai belanja! Data harga diarsipkan untuk bulan depan 🎉', 'success');
    audioEngine.playSuccess();
  }

  // ================= VIEW 2: RIWAYAT & DATABASE HARGA =================
  renderHistorySessions() {
    this.historySessionsList.innerHTML = '';
    const sessions = store.state.historySessions;

    if (sessions.length === 0) {
      this.historySessionsList.innerHTML = `
        <div style="text-align:center; padding: 32px; color: var(--text-dim); font-size:13px;">
          Belum ada riwayat belanja yang diselesaikan.
        </div>
      `;
      return;
    }

    sessions.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-card-header">
          <span class="history-date"><i data-lucide="calendar"></i> ${sess.date}</span>
          <span class="history-badge-items">${sess.itemCount || sess.items.length} Barang</span>
        </div>
        <div class="history-card-body">
          <span class="history-total-spent">${formatRupiah(sess.totalSpent)}</span>
          <span class="history-savings-pill">Hemat Diskon: ${formatRupiah(sess.totalSaved)}</span>
        </div>
      `;
      card.addEventListener('click', () => this.openHistoryDetailModal(sess));
      this.historySessionsList.appendChild(card);
    });

    this.refreshIcons();
  }

  openHistoryDetailModal(session) {
    this.historyDetailTitle.textContent = `Struk Belanja`;
    this.historyDetailDate.textContent = session.date;
    this.historyDetailTotal.textContent = formatRupiah(session.totalSpent);
    this.historyDetailLimit.textContent = formatRupiah(session.budgetLimit || 500000);
    this.historyDetailSaved.textContent = formatRupiah(session.totalSaved || 0);

    this.historyDetailItemsList.innerHTML = '';
    session.items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'receipt-item-row';
      const lineCost = (it.finalUnitPrice || it.price) * (it.qty || 1);
      row.innerHTML = `
        <div>
          <strong>${it.name}</strong>
          <div style="font-size: 10px; color: var(--text-dim);">${it.qty} ${it.unit || 'pcs'} x ${formatRupiah(it.finalUnitPrice || it.price)}</div>
        </div>
        <div style="font-family: var(--font-mono); font-weight: 700;">${formatRupiah(lineCost)}</div>
      `;
      this.historyDetailItemsList.appendChild(row);
    });

    this.historyDetailModalBackdrop.classList.remove('hidden');
    this.refreshIcons();
  }

  closeHistoryDetailModal() {
    this.historyDetailModalBackdrop.classList.add('hidden');
  }

  renderPriceDatabase() {
    const q = this.priceDbSearchInput.value.toLowerCase().trim();
    this.priceDbList.innerHTML = '';
    const db = store.state.priceDatabase;

    const entries = Object.values(db).filter(item => {
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    });

    if (entries.length === 0) {
      this.priceDbList.innerHTML = `
        <div style="text-align:center; padding: 20px; color: var(--text-dim); font-size:12px;">
          Tidak ada data barang yang cocok.
        </div>
      `;
      return;
    }

    entries.forEach(entry => {
      const itemEl = document.createElement('div');
      itemEl.className = 'price-db-item';
      itemEl.innerHTML = `
        <div class="db-item-left">
          <div class="db-item-name">${entry.name}</div>
          <div class="db-item-meta">${entry.category} • Satuan: ${entry.unit} • Update: ${entry.lastUpdated || 'Bulan Lalu'}</div>
        </div>
        <div class="db-item-right">
          <div class="db-item-curr-price">${formatRupiah(entry.pastPrice)}</div>
        </div>
      `;
      this.priceDbList.appendChild(itemEl);
    });
  }

  // ================= VIEW 3: ANGGARAN CENTER =================
  renderBudgetCenter() {
    this.inputBudgetLimit.value = store.state.budgetLimit;

    // Spending breakdown per category
    const catMap = {
      'Bahan Pokok': 0,
      'Protein & Sayur': 0,
      'Bumbu Dapur': 0,
      'Minuman & Snack': 0,
      'Kebersihan & Mandi': 0,
      'Lainnya': 0
    };

    let total = 0;
    store.state.cart.forEach(item => {
      const disc = parseAndCalculateDiscount(item.price, item.discountRaw);
      const sub = disc.finalUnitPrice * item.qty;
      const cat = catMap[item.category] !== undefined ? item.category : 'Lainnya';
      catMap[cat] += sub;
      total += sub;
    });

    this.categoryBreakdownList.innerHTML = '';

    Object.entries(catMap).forEach(([cat, amount]) => {
      if (amount === 0 && total > 0) return;
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      const row = document.createElement('div');
      row.className = 'breakdown-row';
      row.innerHTML = `
        <div class="breakdown-meta">
          <span class="breakdown-name">${cat}</span>
          <span class="breakdown-val">${formatRupiah(amount)} (${pct}%)</span>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      this.categoryBreakdownList.appendChild(row);
    });

    if (total === 0) {
      this.categoryBreakdownList.innerHTML = `
        <div style="font-size: 12px; color: var(--text-dim); text-align: center; padding: 12px;">
          Troli belum terisi barang. Distribusi akan otomatis muncul setelah kamu menambah item.
        </div>
      `;
    }
  }

  exportJsonData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `smart_grocery_backup_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    this.showToast('Data berhasil diekspor ke file JSON', 'success');
  }

  // ================= TOAST NOTIFICATION =================
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'danger' ? 'alert-circle' : 'info';
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    this.toastContainer.appendChild(toast);
    this.refreshIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 220);
    }, 2400);
  }

  // ================= RENDER ALL =================
  renderAll() {
    this.updateSoundButton();
    this.renderBudgetAndSafetyGauge();
    this.renderCartItems();
    this.refreshIcons();
  }

  refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    } else {
      // Offline fallback SVG renderer
      const svgMap = {
        'shopping-cart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
        'shield-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
        'shield-alert': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
        'receipt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v.5"/><path d="M12 6v.5"/></svg>',
        'plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
        'minus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
        'check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
        'check-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        'check-circle-2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        'alert-triangle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
        'alert-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
        'arrow-up-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>',
        'arrow-down-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 7 10 10"/><path d="M17 7v10H7"/></svg>',
        'equal': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" x2="19" y1="9" y2="9"/><line x1="5" x2="19" y1="15" y2="15"/></svg>',
        'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
        'x': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        'trash-2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
        'edit-3': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
        'volume-2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
        'volume-x': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>',
        'percent': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
        'history': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
        'database': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>',
        'wallet': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
        'pie-chart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
        'lightbulb': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
        'package': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>',
        'pencil': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="22" y1="2" y2="6"/><path d="m7.5 20.5 9-9L13 8l-9 9c0 0-1 4-1 4s4-1 4-1z"/></svg>',
        'arrow-down-up': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>',
        'layout-grid': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
        'chevron-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
        'sparkles': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>',
        'hard-drive': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="18" y2="18.01"/><line x1="6" x2="6" y1="18" y2="18.01"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M2 14 5 4h14l3 10"/></svg>',
        'download': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
        'rotate-ccw': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
        'calendar': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
        'tag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="currentColor"/></svg>',
        'info': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        'save': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3"/><path d="M5 3v4h10V3"/></svg>'
      };

      document.querySelectorAll('i[data-lucide]').forEach(el => {
        const name = el.getAttribute('data-lucide');
        if (svgMap[name]) {
          el.innerHTML = svgMap[name];
        }
      });
    }
  }

  // ================= FIREBASE CLOUD SYNC CONTROLLERS (SRS F-06) =================
  initFirebaseSync() {
    if (!window.firebaseSyncService) return;

    window.firebaseSyncService.onStatusChange((status, detail) => {
      this.updateFirebaseUI(status, detail);
    });
  }

  updateFirebaseUI(status, detail = '') {
    if (!this.cloudStatusChip) return;

    this.cloudStatusChip.classList.remove('connected', 'syncing', 'error');
    if (this.firebaseDot) this.firebaseDot.classList.remove('connected', 'syncing', 'error');

    if (status === 'CONNECTED') {
      this.cloudStatusChip.classList.add('connected');
      if (this.cloudStatusText) this.cloudStatusText.textContent = 'Cloud';
      if (this.firebaseDot) this.firebaseDot.classList.add('connected');
      if (this.firebaseStatusTitle) this.firebaseStatusTitle.textContent = 'Terhubung ke Firebase';
      if (this.firebaseStatusSubtitle) this.firebaseStatusSubtitle.textContent = detail || 'Firestore Siap Sinkron';
    } else if (status === 'SYNCING') {
      this.cloudStatusChip.classList.add('syncing');
      if (this.cloudStatusText) this.cloudStatusText.textContent = 'Sync...';
      if (this.firebaseDot) this.firebaseDot.classList.add('syncing');
      if (this.firebaseStatusTitle) this.firebaseStatusTitle.textContent = 'Menyinkronkan Data...';
      if (this.firebaseStatusSubtitle) this.firebaseStatusSubtitle.textContent = detail || 'Sedang proses transfer cloud';
    } else if (status === 'ERROR') {
      this.cloudStatusChip.classList.add('error');
      if (this.cloudStatusText) this.cloudStatusText.textContent = 'Error';
      if (this.firebaseDot) this.firebaseDot.classList.add('error');
      if (this.firebaseStatusTitle) this.firebaseStatusTitle.textContent = 'Kendala Koneksi';
      if (this.firebaseStatusSubtitle) this.firebaseStatusSubtitle.textContent = detail || 'Periksa API Key / Project ID';
    } else {
      if (this.cloudStatusText) this.cloudStatusText.textContent = 'Lokal';
      if (this.firebaseStatusTitle) this.firebaseStatusTitle.textContent = 'Penyimpanan Lokal Saja';
      if (this.firebaseStatusSubtitle) this.firebaseStatusSubtitle.textContent = 'Kredensial Firebase belum diatur. Klik "Atur Kredensial" untuk menghubungkan.';
    }
    this.refreshIcons();
  }

  async handleSyncToFirebase() {
    if (!window.firebaseSyncService) return;

    if (!window.firebaseSyncService.isConfigured()) {
      this.showToast('Atur kredensial Firebase terlebih dahulu', 'info');
      this.openFirebaseModal();
      return;
    }

    try {
      this.showToast('Mengunggah semua data ke Firebase...', 'info');
      await window.firebaseSyncService.uploadAllData(store.state);
      this.showToast('Semua data (troli, harga, riwayat) tersimpan di Cloud Firebase! ☁️', 'success');
      audioEngine.playSuccess();
    } catch (err) {
      this.showToast('Gagal sinkronisasi: ' + err.message, 'danger');
      audioEngine.playDanger();
    }
  }

  async handleDownloadFromFirebase() {
    if (!window.firebaseSyncService) return;

    if (!window.firebaseSyncService.isConfigured()) {
      this.showToast('Atur kredensial Firebase terlebih dahulu', 'info');
      this.openFirebaseModal();
      return;
    }

    if (!confirm('Unduh data dari Cloud Firebase? Data lokal saat ini akan digabungkan/diperbarui dengan data cloud.')) {
      return;
    }

    try {
      this.showToast('Mengunduh data dari Cloud...', 'info');
      const cloudData = await window.firebaseSyncService.downloadAllData();

      if (cloudData.settings && cloudData.settings.budgetLimit) {
        store.state.budgetLimit = cloudData.settings.budgetLimit;
      }
      if (Array.isArray(cloudData.cart)) {
        store.state.cart = cloudData.cart;
      }
      if (cloudData.priceDatabase) {
        store.state.priceDatabase = { ...store.state.priceDatabase, ...cloudData.priceDatabase };
      }
      if (Array.isArray(cloudData.historySessions) && cloudData.historySessions.length > 0) {
        store.state.historySessions = cloudData.historySessions;
      }

      store.saveState();
      this.renderAll();
      this.showToast('Data berhasil diperbarui dari Cloud Firebase!', 'success');
      audioEngine.playSuccess();
    } catch (err) {
      this.showToast('Gagal mengunduh: ' + err.message, 'danger');
      audioEngine.playDanger();
    }
  }

  openFirebaseModal() {
    if (!this.firebaseModalBackdrop) return;

    const currentConfig = window.firebaseSyncService ? window.firebaseSyncService.getConfig() : null;
    if (currentConfig) {
      if (this.inputFirebaseApiKey) this.inputFirebaseApiKey.value = currentConfig.apiKey || '';
      if (this.inputFirebaseProjectId) this.inputFirebaseProjectId.value = currentConfig.projectId || '';
      if (this.inputFirebaseAuthDomain) this.inputFirebaseAuthDomain.value = currentConfig.authDomain || '';
      if (this.inputFirebaseAppId) this.inputFirebaseAppId.value = currentConfig.appId || '';
      if (this.inputFirebaseJson) this.inputFirebaseJson.value = JSON.stringify(currentConfig, null, 2);
    } else {
      if (this.inputFirebaseApiKey) this.inputFirebaseApiKey.value = '';
      if (this.inputFirebaseProjectId) this.inputFirebaseProjectId.value = '';
      if (this.inputFirebaseAuthDomain) this.inputFirebaseAuthDomain.value = '';
      if (this.inputFirebaseAppId) this.inputFirebaseAppId.value = '';
      if (this.inputFirebaseJson) this.inputFirebaseJson.value = '';
    }

    this.firebaseModalBackdrop.classList.remove('hidden');
    this.refreshIcons();
  }

  closeFirebaseModal() {
    if (this.firebaseModalBackdrop) {
      this.firebaseModalBackdrop.classList.add('hidden');
    }
  }

  handleFirebaseJsonPaste(jsonStr) {
    if (!jsonStr) return;
    try {
      // Clean up common JS object copy-pastes
      const cleanJson = jsonStr.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const parsed = JSON.parse(cleanJson);
      if (parsed.apiKey) this.inputFirebaseApiKey.value = parsed.apiKey;
      if (parsed.projectId) this.inputFirebaseProjectId.value = parsed.projectId;
      if (parsed.authDomain) this.inputFirebaseAuthDomain.value = parsed.authDomain;
      if (parsed.appId) this.inputFirebaseAppId.value = parsed.appId;
      this.showToast('Config JSON berhasil terbaca!', 'info');
    } catch (e) {
      // Incomplete JSON or manual entry, ignore
    }
  }

  async saveFirebaseConfig() {
    let config = null;

    const jsonVal = this.inputFirebaseJson ? this.inputFirebaseJson.value.trim() : '';
    if (jsonVal) {
      try {
        const clean = jsonVal.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
        config = JSON.parse(clean);
      } catch (e) {}
    }

    if (!config) {
      const apiKey = this.inputFirebaseApiKey.value.trim();
      const projectId = this.inputFirebaseProjectId.value.trim();
      const authDomain = this.inputFirebaseAuthDomain ? this.inputFirebaseAuthDomain.value.trim() : '';
      const appId = this.inputFirebaseAppId ? this.inputFirebaseAppId.value.trim() : '';

      if (!apiKey || !projectId) {
        alert('Mohon isi minimal API Key dan Project ID!');
        return;
      }

      config = {
        apiKey,
        projectId,
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
        storageBucket: `${projectId}.appspot.com`,
        appId: appId || ''
      };
    }

    if (window.firebaseSyncService) {
      const ok = await window.firebaseSyncService.saveConfig(config);
      this.closeFirebaseModal();
      if (ok) {
        this.showToast('Kredensial Firebase tersimpan & terhubung! ☁️', 'success');
        audioEngine.playSuccess();
        setTimeout(() => {
          this.handleSyncToFirebase();
        }, 500);
      } else {
        this.showToast('Kredensial disimpan, namun belum dapat terhubung ke server.', 'info');
      }
    }
  }

  clearFirebaseConfig() {
    if (confirm('Hapus kredensial Firebase dari aplikasi ini?')) {
      if (window.firebaseSyncService) {
        window.firebaseSyncService.clearConfig();
      }
      this.closeFirebaseModal();
      this.showToast('Kredensial Firebase telah dihapus (kembali ke Mode Lokal)', 'info');
    }
  }

  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
          console.log('PWA ServiceWorker registered with scope:', reg.scope);
        }).catch(err => {
          console.warn('PWA ServiceWorker registration failed:', err);
        });
      });
    }
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
