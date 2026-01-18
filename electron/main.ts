const path = require('path');
const fs = require('fs');

// Startup Logger - minimal safe implementation
const logFile = path.join(process.cwd(), 'startup_debug.txt');
const log = (msg: any) => {
  try {
    const str = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${str}\n`);
  } catch (e) { /* ignore */ }
};

// Auto-Backup Interval
setInterval(() => {
  if (dbModule && dbModule.backup) {
    log('Running Auto-Backup...');
    dbModule.backup();
  }
}, 60 * 60 * 1000); // Every 1 hour

// CRITICAL: Ensure we are NOT in node-only mode
// Some environments set this to " " or "1" which breaks require('electron')
if (process.env.ELECTRON_RUN_AS_NODE) {
  log(`Detected ELECTRON_RUN_AS_NODE: "${process.env.ELECTRON_RUN_AS_NODE}". Deleting...`);
  delete process.env.ELECTRON_RUN_AS_NODE;
}

const { app, BrowserWindow, ipcMain, dialog } = require('electron');

try {
  fs.writeFileSync(logFile, "--- BOOT SEQUENCE STARTS ---\n");
  log(`Process ExecPath: ${process.execPath}`);
  log(`ELECTRON_RUN_AS_NODE: ${process.env.ELECTRON_RUN_AS_NODE}`);
  log(`Electron Version: ${process.versions.electron}`);
  log(`Chrome Version: ${process.versions.chrome}`);
  log(`Node Version: ${process.versions.node}`);
  log(`App available: ${!!app}`);
  log(`BrowserWindow available: ${!!BrowserWindow}`);
} catch (e) { /* ignore */ }

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.stack || error.message}`);
});

let mainWindow: any = null;

const createWindow = () => {
  log('Creating window...');
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    frame: true,
    show: false, // Don't show until ready
    autoHideMenuBar: true,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // and load the index.html of the app.
  if (process.env.VITE_DEV_SERVER_URL) {
    log('Loading Dev URL');
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    log(`Target Index: ${indexPath}`);
    log(`Index Exists? ${fs.existsSync(indexPath)}`);

    // Try loadFile first
    if (mainWindow) {
      mainWindow.loadFile(indexPath).catch((e: any) => {
        log(`loadFile failed: ${e.message}`);
        // Fallback to loadURL
        if (mainWindow) mainWindow.loadURL(`file://${indexPath}`);
      });

      // FORCE OPEN DEVTOOLS FOR DEBUGGING
      mainWindow.webContents.openDevTools();
    }
  }

  // CAPTURE RENDERER CONSOLE LOGS
  mainWindow.webContents.on('console-message', (event: any, level: number, message: string, line: number, sourceId: string) => {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    log(`[Renderer-${levels[level]}] ${message} (${sourceId}:${line})`);
  });
};

let dbModule: any = null;

app.on('ready', async () => {
  log('App ready event received');
  try {
    log('Requiring DB module...');
    dbModule = require('./db');
    const { initDb } = dbModule;

    log('Initializing DB...');
    await initDb(log); // Pass logger
    log('DB Initialized');

    createWindow();
  } catch (e: any) {
    log(`Startup Error: ${e.message} \nStack: ${e.stack}`);
    dialog.showErrorBox('Startup Error', e.message);
  }
});

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

// IPC handlers
ipcMain.handle('db-query', async (event: any, sql: any, params: any) => {
  try {
    if (!dbModule) throw new Error('DB Module not loaded');
    const result = await dbModule.query(sql, params);
    return result;
  } catch (err: any) {
    log(`Database error: ${err.message}`);
    console.error('Database error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('print-raw', async (event: any, data: number[]) => {
  try {
    const buffer = Buffer.from(data);
    log(`[Printer] ESC/POS Pulse Command Sent: ${buffer.toString('hex')}`);

    // Virtual printer success logic (simulation)
    // Real implementation would use node-printer or raw system piping
    return { success: true };
  } catch (err: any) {
    log(`Printer error: ${err.message}`);
    // Show user-friendly error in dev if main window exists
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`console.warn("Printer Error: ${err.message}")`);
    }
    return { success: false, error: "Printer not found or busy. Please check connection." };
  }
});

ipcMain.handle('scale-read-weight', async () => {
  try {
    // Import serialport dynamically
    const { SerialPort } = require('serialport');
    const { ReadlineParser } = require('@serialport/parser-readline');

    // Get scale settings from database
    if (!dbModule) throw new Error('DB not initialized');
    const settings = await dbModule.query('SELECT * FROM settings WHERE key IN (?, ?, ?, ?)',
      ['scale_enabled', 'scale_port', 'scale_baud_rate', 'scale_protocol']);

    const scaleSettings: any = {};
    settings.forEach((row: any) => {
      scaleSettings[row.key] = row.value;
    });

    if (scaleSettings.scale_enabled !== 'true') {
      return { success: false, error: 'Scale is disabled' };
    }

    const port = new SerialPort({
      path: scaleSettings.scale_port || 'COM1',
      baudRate: parseInt(scaleSettings.scale_baud_rate) || 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        port.close();
        resolve({ success: false, error: 'Scale read timeout' });
      }, 3000);

      parser.once('data', (data: string) => {
        clearTimeout(timeout);
        port.close();

        // Parse weight from data (generic format: extract numbers)
        const match = data.match(/([0-9]+\.?[0-9]*)/);
        if (match) {
          const weight = parseFloat(match[1]);
          log(`[Scale] Weight read: ${weight}kg`);
          resolve({ success: true, weight });
        } else {
          resolve({ success: false, error: 'Invalid weight data' });
        }
      });

      port.on('error', (err: any) => {
        clearTimeout(timeout);
        port.close();
        resolve({ success: false, error: err.message });
      });
    });
  } catch (err: any) {
    log(`Scale error: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-window', async (event: any, windowPath: string) => {
  log(`Opening new window for path: ${windowPath}`);

  const newWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    newWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#${windowPath}`);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    newWindow.loadURL(`file://${indexPath}#${windowPath}`);
  }

  return { success: true };
});

// Backup Handlers
ipcMain.handle('db-backup-create', () => {
  if (!dbModule) return { success: false, error: 'DB not loaded' };
  return dbModule.backup();
});

ipcMain.handle('db-backup-list', () => {
  if (!dbModule) return [];
  return dbModule.getBackups();
});

ipcMain.handle('db-backup-restore', (event: any, filename: string) => {
  if (!dbModule) return { success: false, error: 'DB not loaded' };
  const res = dbModule.restoreBackup(filename);
  if (res.success) {
    app.relaunch();
    app.exit(0);
  }
  return res;
});

ipcMain.handle('db-export', async () => {
  if (!dbModule) return { success: false };
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Database',
    defaultPath: 'pos_backup.db',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });

  if (filePath) {
    fs.copyFileSync(dbModule.getDbPath(), filePath);
    return { success: true, path: filePath };
  }
  return { success: false, canceled: true };
});

ipcMain.handle('db-import', async () => {
  if (!dbModule) return { success: false };
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Import Database',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    const res = dbModule.importDb(filePaths[0]);
    if (res.success) {
      app.relaunch();
      app.exit(0);
    }
    return res;
  }
  return { success: false, canceled: true };
});

ipcMain.handle('save-file', async (event: any, { filename, data }: any) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save File',
    defaultPath: filename,
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
  });

  if (filePath) {
    try {
      // Data comes as array/buffer from renderer
      fs.writeFileSync(filePath, Buffer.from(data));
      return { success: true, path: filePath };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
  return { success: false, canceled: true };
});

ipcMain.handle('audit-log-add', (event: any, { userId, userName, action, details }: any) => {
  if (!dbModule) return { success: false };
  return dbModule.addAuditLog(userId, userName, action, details);
});

ipcMain.handle('audit-log-list', (event: any, limit: any) => {
  if (!dbModule) return [];
  return dbModule.getAuditLogs(limit);
});

// Notifications
ipcMain.handle('notification-add', (event: any, payload: any) => {
  return dbModule.addNotification(payload.type, payload.title, payload.message);
});
ipcMain.handle('notification-list', (event: any, unreadOnly: any) => {
  return dbModule.getNotifications(unreadOnly);
});
ipcMain.handle('notification-read', (event: any, id: any) => {
  return dbModule.markNotificationRead(id);
});
ipcMain.handle('notification-read-all', () => {
  return dbModule.markAllNotificationsRead();
});

// --- AI ASSIST (VOSK) ---
// Vosk moved to Renderer (WASM) due to native build issues on Windows
ipcMain.on('ai-start', () => { });
ipcMain.on('ai-stop', () => { });
ipcMain.on('ai-audio-chunk', () => { });
