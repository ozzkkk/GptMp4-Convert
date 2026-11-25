const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('browserAPI', Object.freeze({
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  back: () => ipcRenderer.invoke('browser:back'),
  forward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  copyUrl: (url) => ipcRenderer.invoke('browser:copy-url', url),
  onDetected: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('media:detected', listener);
    return () => ipcRenderer.removeListener('media:detected', listener);
  },
  onNavigated: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('browser:navigated', listener);
    return () => ipcRenderer.removeListener('browser:navigated', listener);
  }
}));
