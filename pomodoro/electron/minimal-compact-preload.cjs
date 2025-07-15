// Minimal compact preload script

console.log('minimal-compact-preload.cjs is running');

try {
  const { contextBridge, ipcRenderer } = require('electron');
  console.log('require(\'electron\') succeeded in minimal-compact-preload.cjs');

  // Expose a simple function to the renderer
  contextBridge.exposeInMainWorld('electronAPI', {
    // Send control commands to the main process (start, pause, restore)
    sendControlCommand: (command) => ipcRenderer.send('compact-timer-control', command),

    // Listen for timer updates from the main process
    onTimerUpdate: (callback) => ipcRenderer.on('timer-update', (event, timeLeft, isRunning) => callback(timeLeft, isRunning)),
  });
  console.log('electronAPI exposed successfully in minimal-compact-preload.cjs.');

} catch (error) {
  console.error('Error in minimal-compact-preload.cjs during require(\'electron\'):', error);
  // Attempt to expose a dummy API if require fails
  if (typeof contextBridge !== 'undefined') {
     contextBridge.exposeInMainWorld('electronAPI', {
       sendMessageToMain: (message) => console.error('IPC not available, cannot send message:', message)
     });
     console.log('Dummy electronAPI exposed in minimal-compact-preload.cjs.');
  } else {
     window.electronAPI = {
       sendMessageToMain: (message) => console.error('IPC and contextBridge not available, cannot send message:', message)
     };
     console.log('Dummy electronAPI exposed directly on window in minimal-compact-preload.cjs.');
  }
} 