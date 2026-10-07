/**
 * CLI SCRIPT: Upload All Smart Grocery Data to Firebase Firestore via REST API
 * Usage:
 *   node sync_to_firebase.js --project=YOUR_PROJECT_ID --key=YOUR_API_KEY
 * or configure firebase-config.js and run:
 *   node sync_to_firebase.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read config
let config = {};
try {
  const configFile = fs.readFileSync(path.join(__dirname, 'firebase-config.js'), 'utf8');
  const match = configFile.match(/window\.FIREBASE_CONFIG\s*=\s*({[\s\S]*?});/);
  if (match) {
    config = eval('(' + match[1] + ')');
  }
} catch (e) {}

// Parse CLI flags
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--project=')) config.projectId = arg.split('=')[1];
  if (arg.startsWith('--key=')) config.apiKey = arg.split('=')[1];
});

if (!config.projectId || !config.apiKey) {
  console.log(`
========================================================================
PANDUAN SINKRONISASI FIREBASE:
1. Cara Termudah (Melalui Web UI):
   Buka http://localhost:3000 -> Tab Anggaran -> Klik "Atur Kredensial"
   Tempel Firebase Config JSON Anda lalu klik "Simpan & Hubungkan".

2. Cara CLI Terminal:
   node sync_to_firebase.js --project=ID_PROJECT_ANDA --key=API_KEY_ANDA

3. Atau isi kredensial di file: firebase-config.js
========================================================================
`);
  process.exit(0);
}

const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase_seed_data.json'), 'utf8'));

console.log(`Menghubungkan ke Firebase Project: ${config.projectId}...`);

function firestorePost(collection, docId, data) {
  return new Promise((resolve, reject) => {
    // Firestore REST API v1
    const urlPath = `/v1/projects/${config.projectId}/databases/(default)/documents/${collection}/${docId}?key=${config.apiKey}`;
    
    // Transform JS object to Firestore Fields JSON format
    function toFirestoreValue(val) {
      if (typeof val === 'string') return { stringValue: val };
      if (typeof val === 'number') {
        if (Number.isInteger(val)) return { integerValue: String(val) };
        return { doubleValue: val };
      }
      if (typeof val === 'boolean') return { booleanValue: val };
      if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(toFirestoreValue) } };
      }
      if (val && typeof val === 'object') {
        const fields = {};
        for (const k in val) fields[k] = toFirestoreValue(val[k]);
        return { mapValue: { fields } };
      }
      return { nullValue: null };
    }

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
      res.on('data', chunk => body += chunk);
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

async function uploadAll() {
  try {
    console.log('1. Mengunggah Pengaturan Anggaran (settings)...');
    await firestorePost('smart_grocery', 'settings', seedData.smart_grocery.settings);
    console.log('   ✔ settings terunggah');

    console.log('2. Mengunggah Troli Aktif (active_cart)...');
    await firestorePost('smart_grocery', 'active_cart', seedData.smart_grocery.active_cart);
    console.log('   ✔ active_cart terunggah');

    console.log('3. Mengunggah Database Harga Bulan Lalu (price_database)...');
    await firestorePost('smart_grocery', 'price_database', seedData.smart_grocery.price_database);
    console.log('   ✔ price_database terunggah');

    console.log('4. Mengunggah Riwayat Belanja (shopping_history)...');
    for (const sess of seedData.shopping_history) {
      await firestorePost('shopping_history', sess.id, sess);
      console.log(`   ✔ session ${sess.id} terunggah`);
    }

    console.log('\n🎉 SEMUA DATA BERHASIL DIUNGGAH KE FIREBASE CLOUD FIRESTORE!');
  } catch (err) {
    console.error('Gagal mengunggah ke Firestore:', err.message);
  }
}

uploadAll();
