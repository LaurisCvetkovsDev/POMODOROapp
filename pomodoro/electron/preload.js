const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для рендер процесса
contextBridge.exposeInMainWorld('electronAPI', {
    // Автообновления
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // События автообновлений
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    
    // Удаление слушателей
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}); 