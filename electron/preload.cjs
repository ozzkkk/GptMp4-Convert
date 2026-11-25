const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', Object.freeze({
  openBrowser: () => ipcRenderer.invoke('app:open-browser')
}));
