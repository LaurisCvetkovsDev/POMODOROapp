const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the main window renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Timer controls
  startTimer: () => ipcRenderer.send('timer-control', 'start'),
  pauseTimer: () => ipcRenderer.send('timer-control', 'pause'),
  stopTimer: () => ipcRenderer.send('timer-control', 'stop'),
  resetTimer: () => ipcRenderer.send('timer-control', 'reset'),
  
  // Timer state updates
  sendTimerUpdate: (timeLeft, isRunning) => ipcRenderer.send('timer-update', timeLeft, isRunning),
  updateTimerSettings: (workDuration, breakDuration) => ipcRenderer.send('timer-settings-update', workDuration, breakDuration),
  
  // Window controls
  minimizeTimer: () => ipcRenderer.send('minimize-timer'),
  restoreTimer: () => ipcRenderer.send('timer-control', 'restore'),
  
  // Timer state listeners
  onTimerUpdate: (callback) => {
    ipcRenderer.on('timer-update', (_, timeLeft, isRunning, isWorkPhase) => {
      callback(timeLeft, isRunning, isWorkPhase);
    });
  },

  // Listen for restore event
  onRestore: (callback) => {
    ipcRenderer.on('restore-timer', callback);
  },

  // Listen for timer sync updates from main process
  onTimerSync: (callback) => {
    // Remove any existing listeners first to prevent duplicates
    ipcRenderer.removeAllListeners('timer-sync');
    ipcRenderer.on('timer-sync', (_, update) => {
      callback(update);
    });
  },

  // Remove listener (for cleanup)
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 