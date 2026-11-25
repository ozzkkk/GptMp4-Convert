const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('node:path');

let mainWindow = null;
let browserWindow = null;
let browserView = null;
let browserSession = null;
const seenMedia = new Set();

function isSafeWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 780,
    minHeight: 600,
    backgroundColor: '#0b1120',
    title: 'GptMp4 Convert',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function mediaKind(url, contentType = '') {
  const clean = url.split('?')[0].toLowerCase();
  const type = contentType.toLowerCase();
  if (/\.m3u8$/.test(clean) || type.includes('mpegurl')) return 'HLS';
  if (/\.mpd$/.test(clean) || type.includes('dash+xml')) return 'DASH';
  if (/\.(mp4|m4v|mov)$/.test(clean) || type.includes('video/mp4')) return 'MP4';
  if (/\.(webm)$/.test(clean) || type.includes('video/webm')) return 'WebM';
  if (/\.(mp3|m4a|aac|ogg|opus|wav)$/.test(clean) || type.startsWith('audio/')) return 'Ses';
  if (type.startsWith('video/')) return 'Video';
  return null;
}

function installMediaDetection(targetSession) {
  targetSession.webRequest.onHeadersReceived(
    { urls: ['http://*/*', 'https://*/*'] },
    (details, callback) => {
      const contentTypeHeader = Object.entries(details.responseHeaders || {})
        .find(([name]) => name.toLowerCase() === 'content-type');
      const contentType = contentTypeHeader?.[1]?.[0] || '';
      const kind = mediaKind(details.url, contentType);
      if (kind && browserWindow && !browserWindow.isDestroyed()) {
        const key = details.url;
        if (!seenMedia.has(key)) {
          seenMedia.add(key);
          browserWindow.webContents.send('media:detected', {
            url: details.url,
            kind,
            contentType: String(contentType).split(';')[0],
            statusCode: details.statusCode,
            tabUrl: browserView?.webContents.getURL() || ''
          });
        }
      }
      callback({ responseHeaders: details.responseHeaders });
    }
  );
}

function resizeBrowserView() {
  if (!browserWindow || !browserView || browserWindow.isDestroyed()) return;
  const [width, height] = browserWindow.getContentSize();
  browserView.setBounds({
    x: 0,
    y: 104,
    width,
    height: Math.max(100, height - 104)
  });
}

function createBrowserWindow() {
  if (browserWindow && !browserWindow.isDestroyed()) {
    browserWindow.focus();
    return;
  }

  seenMedia.clear();
  browserSession = session.fromPartition('persist:gptmp4-inapp-browser');
  installMediaDetection(browserSession);

  browserWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#0b1120',
    title: 'GptMp4 Convert — Uygulama İçi Tarayıcı',
    webPreferences: {
      preload: path.join(__dirname, 'browser-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  browserWindow.loadFile(path.join(__dirname, '../browser.html'));
  browserWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  browserView = new BrowserView({
    webPreferences: {
      session: browserSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  browserWindow.setBrowserView(browserView);
  resizeBrowserView();
  browserWindow.on('resize', resizeBrowserView);
  browserWindow.on('closed', () => {
    if (browserView && !browserView.webContents.isDestroyed()) browserView.webContents.close();
    browserView = null;
    browserWindow = null;
    browserSession = null;
  });

  browserView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  browserView.webContents.on('will-navigate', (event, url) => {
    if (!isSafeWebUrl(url)) event.preventDefault();
  });
  browserView.webContents.on('did-navigate', (_event, url) => {
    if (browserWindow && !browserWindow.isDestroyed()) {
      browserWindow.webContents.send('browser:navigated', {
        url,
        canGoBack: browserView.webContents.canGoBack(),
        canGoForward: browserView.webContents.canGoForward()
      });
    }
  });
  browserView.webContents.on('did-navigate-in-page', (_event, url) => {
    if (browserWindow && !browserWindow.isDestroyed()) {
      browserWindow.webContents.send('browser:navigated', {
        url,
        canGoBack: browserView.webContents.canGoBack(),
        canGoForward: browserView.webContents.canGoForward()
      });
    }
  });
  browserView.webContents.loadURL('https://www.google.com');
}

ipcMain.handle('app:open-browser', () => {
  createBrowserWindow();
  return true;
});

ipcMain.handle('browser:navigate', async (_event, value) => {
  if (!browserView || !isSafeWebUrl(value)) throw new Error('Yalnızca http:// ve https:// adresleri açılabilir.');
  await browserView.webContents.loadURL(value);
  return true;
});

ipcMain.handle('browser:back', () => {
  if (browserView?.webContents.canGoBack()) browserView.webContents.goBack();
});
ipcMain.handle('browser:forward', () => {
  if (browserView?.webContents.canGoForward()) browserView.webContents.goForward();
});
ipcMain.handle('browser:reload', () => browserView?.webContents.reload());
ipcMain.handle('browser:copy-url', (_event, value) => {
  if (typeof value !== 'string' || value.length > 8192) throw new Error('Geçersiz bağlantı.');
  const { clipboard } = require('electron');
  clipboard.writeText(value);
  return true;
});

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
