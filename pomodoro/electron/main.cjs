const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const { initialize, enable } = require('@electron/remote/main');
let isDev = false;

try {
  isDev = require('electron-is-dev');
} catch (_) {
  isDev = false;
}

initialize();

let mainWindow;
let compactWindow;

// Timer state
let timerInterval = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let isWorkPhase = true;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs') 
    },
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5173'  // Vite dev server port
      : `file://${path.join(__dirname, '../dist/index.html')}`  // Vite build output
  );

  // Открыть DevTools в режиме разработки
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Optional: Listen for the main window to be closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.close();
      compactWindow = null;
    }
  });

  // Also set CSP for main window
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; connect-src 'self'  http://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://localhost:*"
        ]
      }
    });
  });
}

// Function to create the compact timer window
function createCompactWindow() {
  if (compactWindow && !compactWindow.isDestroyed()) {
    compactWindow.focus();
    return;
  }

  // Fixed dimensions for compact window
  const compactWindowWidth = 260;
  const compactWindowHeight = 140;

  // Fixed position in bottom right corner
  const x = 20;
  const y = 20;

  compactWindow = new BrowserWindow({
    width: compactWindowWidth,
    height: compactWindowHeight,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    roundedCorners: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Set CSP header for security
  compactWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; connect-src 'self' https://laucve1.dreamhosters.com http://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://localhost:*"
        ]
      }
    });
  });

  // Открыть DevTools для компактного окна в режиме разработки
  if (isDev) {
    compactWindow.webContents.openDevTools();
  }

  // Load the compact timer HTML file
  compactWindow.loadFile(path.join(__dirname, 'minimal-compact.html'));

  // Hide main window when compact window is shown
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }

  // Add logging for window events
  compactWindow.on('ready-to-show', () => {
    console.log('Compact window ready-to-show.');
    compactWindow.show();
  });

  compactWindow.on('show', () => {
    console.log('Compact window shown.');
  });

  compactWindow.on('hide', () => {
    console.log('Compact window hidden.');
  });

  compactWindow.on('closed', () => {
    console.log('Compact window closed.');
    compactWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.webContents.send('restore-timer');
    }
  });

  // Prevent the compact window from being garbage collected prematurely
  compactWindow.on('close', (e) => {
    console.log('Compact window close event.');
    if (!app.isQuitting) {
      e.preventDefault();
      compactWindow.hide();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.webContents.send('restore-timer');
      }
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  // Create the application menu (moved here to ensure mainWindow is initialized)
  console.log('Attempting to create application menu.');
  const menuTemplate = [
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Toggle Main Window DevTools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            // if (mainWindow) {
            //   mainWindow.webContents.toggleDevTools();
            // }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  console.log('Application menu template built.', menu);
  Menu.setApplicationMenu(menu);
  console.log('Application menu set.');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler to minimize the main window and show the compact timer
ipcMain.on('minimize-timer', () => {
  console.log('Main process received minimize-timer command.');
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('Main process hiding main window.');
    // mainWindow.hide(); // Temporarily prevent hiding main window for debugging
    createCompactWindow(); 
  }
});

// Update timer
function updateTimer() {
  if (timeLeft > 0) {
    timeLeft--;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer-update', timeLeft, isRunning, isWorkPhase);
    }
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.webContents.send('timer-update', timeLeft, isRunning, isWorkPhase);
    }
  } else {
    // Switch phases
    isWorkPhase = !isWorkPhase;
    timeLeft = isWorkPhase ? 25 * 60 : 5 * 60; // 25 min work, 5 min break
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer-update', timeLeft, isRunning, isWorkPhase);
    }
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.webContents.send('timer-update', timeLeft, isRunning, isWorkPhase);
    }
  }
}

// Handle timer controls
ipcMain.on('timer-control', (_, command) => {
  switch (command) {
    case 'start':
      if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
      }
      break;
    case 'pause':
      if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
      }
      break;
    case 'stop':
      isRunning = false;
      clearInterval(timerInterval);
      timeLeft = isWorkPhase ? 25 * 60 : 5 * 60;
      break;
    case 'reset':
      isRunning = false;
      clearInterval(timerInterval);
      timeLeft = isWorkPhase ? 25 * 60 : 5 * 60;
      break;
    case 'settings':
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
      break;
    case 'restore':
      if (compactWindow) {
        compactWindow.close();
        compactWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
      break;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('timer-update', timeLeft, isRunning, isWorkPhase);
  }
  if (compactWindow && !compactWindow.isDestroyed()) {
    compactWindow.webContents.send('timer-update', timeLeft, isRunning, isWorkPhase);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
}); 