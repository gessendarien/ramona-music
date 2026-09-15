const { contextBridge, shell, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  platform: process.platform,
  openExternal: (url) => shell.openExternal(url),
  openPath: (p) => shell.openPath(p),
  showItemInFolder: (p) => shell.showItemInFolder(p),
  getAppVersion: () => ipcRenderer.invoke('app:version')
});
