const https = require('https');
const fs = require('fs');
const path = require('path');

const projectId = 'smartgrocery-3128a';
const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase_seed_data.json'), 'utf8'));

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const k in val) {
      fields[k] = toFirestoreValue(val[k]);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function firestoreSet(collection, docId, data) {
  return new Promise((resolve, reject) => {
    const urlPath = `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
    const payload = JSON.stringify({
      fields: Object.keys(data).reduce((acc, k) => {
        acc[k] = toFirestoreValue(data[k]);
        return acc;
      }, {})
    });

    const req = https.request({
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: urlPath,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function firestoreDelete(collection, docId) {
  return new Promise((resolve, reject) => {
    const urlPath = `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: urlPath,
      method: 'DELETE'
    }, res => {
      res.on('data', () => {});
      res.on('end', () => resolve(true));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log(`🚀 Memulai pengunggahan semua data ke Firebase Firestore [${projectId}]...`);

  // 1. Settings
  console.log('1. Mengunggah Pengaturan Anggaran & Safety Cap (smart_grocery/settings)...');
  await firestoreSet('smart_grocery', 'settings', seedData.smart_grocery.settings);
  console.log('   ✔ smart_grocery/settings berhasil');

  // 2. Active Cart
  console.log('2. Mengunggah Troli Belanja Aktif (smart_grocery/active_cart)...');
  await firestoreSet('smart_grocery', 'active_cart', seedData.smart_grocery.active_cart);
  console.log('   ✔ smart_grocery/active_cart berhasil');

  // 3. Price Database
  console.log('3. Mengunggah Database Harga Patokan Bulan Lalu (smart_grocery/price_database)...');
  await firestoreSet('smart_grocery', 'price_database', seedData.smart_grocery.price_database);
  console.log('   ✔ smart_grocery/price_database berhasil');

  // 4. History Sessions
  console.log('4. Mengunggah Riwayat Belanja (shopping_history)...');
  for (const session of seedData.shopping_history) {
    await firestoreSet('shopping_history', session.id, session);
    console.log(`   ✔ shopping_history/${session.id} berhasil`);
  }

  // Also add current active shopping session draft
  const currentSession = {
    id: 'session_okt_2026',
    date: '7 Oktober 2026',
    timestamp: Date.now(),
    totalSpent: 138500,
    budgetLimit: 500000,
    totalSaved: 38700,
    itemCount: 4,
    items: seedData.smart_grocery.active_cart.items
  };
  await firestoreSet('shopping_history', currentSession.id, currentSession);
  console.log(`   ✔ shopping_history/${currentSession.id} berhasil`);

  // Delete test connection
  await firestoreDelete('smart_grocery', 'test_connection');

  console.log('\n🎉 SEMUA DATA BERHASIL DIMASUKKAN KE FIREBASE CLOUD FIRESTORE!');
}

main().catch(err => {
  console.error('Terjadi kesalahan:', err);
  process.exit(1);
});
