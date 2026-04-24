const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// More reliable dev mode detection
const isDev = !app.isPackaged;

// Route all auto-updater logs to file
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

log.info('App starting. Version:', app.getVersion());

// Auto-updater events - Set up BEFORE creating window
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version);
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available. Current version is latest:', info.version);
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version);
  // Install and restart the app
  autoUpdater.quitAndInstall();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // Load from localhost in dev, or from build folder in production
  const startUrl = isDev
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, 'build/index.html'),
        protocol: 'file:',
        slashes: true
      });

  win.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Check for updates (only in production)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  return win;
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});