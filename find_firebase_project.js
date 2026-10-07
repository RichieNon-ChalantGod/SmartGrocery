const fs = require('fs');
const path = require('path');
const os = require('os');

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');

function searchDir(baseDir) {
  if (!fs.existsSync(baseDir)) return [];
  const entries = fs.readdirSync(baseDir);
  const histories = [];
  for (const entry of entries) {
    const full = path.join(baseDir, entry);
    if (fs.statSync(full).isDirectory()) {
      const hist = path.join(full, 'History');
      if (fs.existsSync(hist)) histories.push(hist);
    }
  }
  return histories;
}

const histories = [
  ...searchDir(path.join(localAppData, 'Google', 'Chrome', 'User Data')),
  ...searchDir(path.join(localAppData, 'Microsoft', 'Edge', 'User Data'))
];

let foundProjects = new Set();

for (const p of histories) {
  try {
    const tempPath = path.join(os.tmpdir(), `hist_${Date.now()}_${Math.random()}.db`);
    fs.copyFileSync(p, tempPath);
    const buf = fs.readFileSync(tempPath);
    fs.unlinkSync(tempPath);

    const str = buf.toString('latin1');
    const regex = /console\.firebase\.google\.com\/project\/([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match[1] && !match[1].startsWith('_') && match[1] !== 'overview') {
        foundProjects.add(match[1]);
      }
    }
  } catch (e) {}
}

console.log('FOUND_PROJECTS:', JSON.stringify(Array.from(foundProjects)));
