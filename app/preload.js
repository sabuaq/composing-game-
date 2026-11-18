const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  load: (name) => ipcRenderer.invoke('data:load', name),
  save: (name, obj) => ipcRenderer.invoke('data:save', name, obj),
  scan: (roots) => ipcRenderer.invoke('scan', roots),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  alwaysOnTop: (flag) => ipcRenderer.invoke('always-on-top', flag),
  compact: (flag) => ipcRenderer.invoke('compact', flag),
});
