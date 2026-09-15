const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { fork } = require('child_process');

app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;
let backendProcess = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function findIcon() {
  const candidates = [
    path.join(__dirname, '..', 'icon.png'),
    path.join(__dirname, '..', 'build', 'icons', '512x512.png'),
    path.join(__dirname, '..', '..', 'icon.png'),
    path.join(process.resourcesPath, 'icon.png'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'icon.png')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function getBackendDir() {
  if (app.isPackaged) {
    const packagedPath = path.join(process.resourcesPath, 'backend');
    if (fs.existsSync(packagedPath)) return packagedPath;
  }
  const rootBackend = path.resolve(__dirname, '../../backend');
  if (fs.existsSync(rootBackend)) return rootBackend;
  const localBackend = path.resolve(__dirname, '../backend');
  if (fs.existsSync(localBackend)) return localBackend;
  return null;
}

function getWebDistDir() {
  if (app.isPackaged) {
    const packagedDist = path.join(__dirname, '..', 'web-dist');
    if (fs.existsSync(packagedDist)) return packagedDist;
  }
  const rootWebDist = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(rootWebDist)) return rootWebDist;
  const localWebDist = path.resolve(__dirname, '../web-dist');
  if (fs.existsSync(localWebDist)) return localWebDist;
  return null;
}

function checkBackendHealth(port = 3001) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function getExtendedEnv() {
  const extraBinDirs = [
    path.join(process.env.HOME || '', '.local', 'bin'),
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin'
  ];
  const currentPath = process.env.PATH || '';
  const envPath = [...new Set([...extraBinDirs, ...currentPath.split(':')])].filter(Boolean).join(':');

  const webDist = getWebDistDir();

  return {
    ...process.env,
    PATH: envPath,
    PORT: '3001',
    DESKTOP_MODE: 'true',
    WEB_DIST_PATH: webDist || '',
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: 'production'
  };
}

async function startEmbeddedBackend() {
  const isRunning = await checkBackendHealth(3001);
  if (isRunning) {
    console.log('[Desktop] Backend ya está corriendo en el puerto 3001.');
    return;
  }

  const backendDir = getBackendDir();
  if (!backendDir) {
    console.warn('[Desktop] No se encontró el directorio del backend. La app continuará sin backend integrado.');
    return;
  }

  const backendEntry = path.join(backendDir, 'src', 'app.js');
  if (!fs.existsSync(backendEntry)) {
    console.warn(`[Desktop] No se encontró el punto de entrada del backend en: ${backendEntry}`);
    return;
  }

  console.log(`[Desktop] Iniciando backend embebido desde: ${backendEntry}`);

  try {
    const userDataDir = app.getPath('userData');
    const userMusicDir = path.join(app.getPath('music') || path.join(process.env.HOME || '/tmp', 'Music'), 'Ramona');
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.mkdirSync(userMusicDir, { recursive: true });

    const env = {
      ...getExtendedEnv(),
      MUSIC_PATH: userMusicDir,
      RAMONA_DATA_DIR: userDataDir
    };

    backendProcess = fork(backendEntry, [], {
      cwd: userDataDir,
      env: env,
      execArgv: [],
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });

    backendProcess.stdout?.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    backendProcess.stderr?.on('data', (data) => {
      console.error(`[Backend ERR] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (err) => {
      console.error('[Desktop] Error en el proceso del backend:', err);
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`[Backend] Proceso finalizado con código: ${code}, señal: ${signal}`);
      backendProcess = null;
    });

    // Wait up to 6 seconds for the backend to be healthy
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 250));
      if (await checkBackendHealth(3001)) {
        console.log('[Desktop] Backend inicializado exitosamente en el puerto 3001.');
        break;
      }
    }
  } catch (err) {
    console.error('[Desktop] Error al iniciar backend embebido:', err);
  }
}

function stopEmbeddedBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('[Desktop] Deteniendo backend embebido...');
    try {
      backendProcess.kill();
    } catch (e) {
      console.error('[Desktop] Error deteniendo backend:', e);
    }
    backendProcess = null;
  }
}

async function createWindow() {
  const icon = findIcon();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Ramona Music',
    backgroundColor: '#0e0e0e',
    icon: icon || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

  const isHealthy = await checkBackendHealth(3001);
  const webDist = getWebDistDir();

  if (isHealthy) {
    console.log('[Desktop] Cargando UI desde servidor local http://127.0.0.1:3001');
    mainWindow.loadURL('http://127.0.0.1:3001').catch(() => {
      if (webDist && fs.existsSync(path.join(webDist, 'index.html'))) {
        mainWindow.loadFile(path.join(webDist, 'index.html'));
      }
    });
  } else if (webDist && fs.existsSync(path.join(webDist, 'index.html'))) {
    console.log('[Desktop] Cargando UI desde archivo estático');
    mainWindow.loadFile(path.join(webDist, 'index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'fallback.html')).catch(() => {});
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('app:version', () => app.getVersion());

app.whenReady().then(async () => {
  await startEmbeddedBackend();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  stopEmbeddedBackend();
});

app.on('window-all-closed', () => {
  stopEmbeddedBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
