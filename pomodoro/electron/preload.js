const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the main window renderer
contextBridge.exposeInMainWorld('electron', {
  // Method to send minimize command to the main process
  minimizeTimer: () => ipcRenderer.send('minimize-timer'),

  // Method to send timer updates to the main process
  sendTimerUpdate: (timeLeft, isRunning) => ipcRenderer.send('timer-update', timeLeft, isRunning),

  // Method to receive restore command from the main process
  onRestoreTimer: (callback) => ipcRenderer.on('restore-timer', (event) => callback()),

  // Methods to send timer control commands to the main process (if Stopwatch.tsx sends these)
  startTimer: () => ipcRenderer.send('start-timer'),
  pauseTimer: () => ipcRenderer.send('pause-timer'),
  resetTimer: () => ipcRenderer.send('reset-timer'),
}); 