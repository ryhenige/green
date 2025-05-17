const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');
const Database = require('better-sqlite3');
const { v4: uuid } = require('uuid');

// Paths
const dbPath = path.join(app.getPath('userData'), 'connections.db');
const licensePath = path.join(app.getPath('userData'), 'license.json');
const shippedLicensePath = path.join(__dirname, 'license.json'); // use process.resourcesPath for production

// SQLite setup
const sqlite = new Database(dbPath);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    name TEXT,
    host TEXT,
    port INTEGER,
    database TEXT,
    username TEXT,
    password TEXT,
    adapter TEXT,
    last_used_at TEXT
  )
`);
// Make sqlite and uuid globally available for backend handlers
global.sqlite = sqlite;
global.uuid = uuid;

// License validation
function validateOrActivateLicense() {
  const machineId = machineIdSync();
  if (!fs.existsSync(licensePath)) {
    if (!fs.existsSync(shippedLicensePath)) throw new Error('License file missing.');
    const license = JSON.parse(fs.readFileSync(shippedLicensePath));
    license.machineId = machineId;
    license.activatedAt = new Date().toISOString();
    fs.writeFileSync(licensePath, JSON.stringify(license));
  } else {
    const license = JSON.parse(fs.readFileSync(licensePath));
    if (license.machineId !== machineId) throw new Error('License not valid for this machine.');
  }
}

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'),
      contextIsolation: true
    }
  });
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:8080');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  try {
    validateOrActivateLicense();
    createWindow();
    require('./backend/ipcHandlers'); // Register all IPC handlers
  } catch (err) {
    console.error(err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});