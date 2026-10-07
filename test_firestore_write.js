const https = require('https');
const fs = require('fs');

const projectId = 'smartgrocery-3128a';
const testData = {
  name: 'Beras Ramos 5kg',
  category: 'Bahan Pokok',
  price: 72000,
  test: true
};

function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  return { nullValue: null };
}

const payload = JSON.stringify({
  fields: {
    name: toFirestoreValue(testData.name),
    category: toFirestoreValue(testData.category),
    price: toFirestoreValue(testData.price),
    test: toFirestoreValue(testData.test)
  }
});

const req = https.request({
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: `/v1/projects/${projectId}/databases/(default)/documents/smart_grocery/test_connection`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', body);
  });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
