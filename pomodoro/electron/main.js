const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
let isDev = false;

try {
  isDev = require('electron-is-dev');
} catch (_) {
  isDev = false;
}

let mainWindow;
let compactWindow;

// Taimera stāvoklis, ko pārvalda galvenais process
let timerState = {
  timeLeft: 0, // Tiks inicializēts no renderētāja iestatījumiem
  isRunning: false,
  isWorkPhase: true,
  workDuration: 0, // Tiks iestatīts no renderētāja iestatījumiem
  shortBreakDuration: 0, // Tiks iestatīts no renderētāja iestatījumiem
  initialized: false // Izseko, vai iestatījumi ir saņemti no renderētāja
};
let timerInterval = null;

// Ierobežošana, lai novērstu ātrus atjauninājumus
let lastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 200;

// Karogs, lai izsekotu minimizēšanas/atjaunošanas operācijas
let isMinimizeRestoreInProgress = false;

// Taimera pārvaldības funkcijas
function startTimer() {
  if (!timerState.isRunning && timerState.timeLeft > 0) {
    timerState.isRunning = true;
    
    timerInterval = setInterval(() => {
      timerState.timeLeft--;
      broadcastTimerUpdate();
      
      if (timerState.timeLeft <= 0) {
        handleTimerCompletion();
      }
    }, 1000);
    
    broadcastTimerUpdate();
  }
}

function pauseTimer() {
  timerState.isRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  broadcastTimerUpdate();
}

function resetTimer() {
  timerState.isRunning = false;
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Atiestatīt uz pašreizējās fāzes ilgumu
  timerState.timeLeft = timerState.isWorkPhase ? 
    timerState.workDuration * 60 : 
    timerState.shortBreakDuration * 60;
    
  broadcastTimerUpdate();
}

function handleTimerCompletion() {
  timerState.isRunning = false;
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (timerState.isWorkPhase) {
    // Darbs pabeigts → Pārslēgt uz pārtraukuma fāzi, bet nestartēt automātiski
    timerState.isWorkPhase = false;
    timerState.timeLeft = timerState.shortBreakDuration * 60;
  } else {
    // Pārtraukums pabeigts → Pārslēgt uz darba fāzi un apstāties
    timerState.isWorkPhase = true;
    timerState.timeLeft = timerState.workDuration * 60;
  }
  
  broadcastTimerUpdate();
}

function updateTimerState(timeLeft, isRunning) {
  // Izlaist atjauninājumus minimizēšanas/atjaunošanas operāciju laikā
  if (isMinimizeRestoreInProgress) {
    return;
  }

  // Ierobežot ātrus atjauninājumus, lai novērstu svārstības
  const now = Date.now();
  if (now - lastUpdateTime < UPDATE_THROTTLE_MS) {
    return;
  }
  lastUpdateTime = now;

  const oldTimeLeft = timerState.timeLeft;
  timerState.timeLeft = timeLeft;
  
  if (isRunning && !timerState.isRunning) {
    // Startēt taimeri no renderētāja
    timerState.isRunning = true;
    
    if (!timerInterval && timeLeft > 0) {
      timerInterval = setInterval(() => {
        timerState.timeLeft--;
        broadcastTimerUpdate();
        
        if (timerState.timeLeft <= 0) {
          handleTimerCompletion();
        }
      }, 1000);
    }
  } else if (!isRunning && timerState.isRunning) {
    // Apturēt taimeri no renderētāja
    timerState.isRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  // Pārraidīt tikai, ja tas ir nozīmīgas izmaiņas
  if (oldTimeLeft !== timeLeft || timerState.isRunning !== isRunning) {
    broadcastTimerUpdate();
  }
}

function updateTimerSettings(workDuration, breakDuration) {
  timerState.workDuration = workDuration;
  timerState.shortBreakDuration = breakDuration;
  
  // Ja šī ir pirmā reize, kad saņemam iestatījumus (inicializācija)
  if (!timerState.initialized) {
    timerState.timeLeft = timerState.isWorkPhase ? workDuration * 60 : breakDuration * 60;
    timerState.initialized = true;
  }
  // Ja taimeris nedarbojas, atjaunināt uz jauno ilgumu pašreizējai fāzei
  else if (!timerState.isRunning) {
    const newTimeLeft = timerState.isWorkPhase ? workDuration * 60 : breakDuration * 60;
    timerState.timeLeft = newTimeLeft;
  }
}

function broadcastTimerUpdate() {
  const update = {
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning,
    isWorkPhase: timerState.isWorkPhase
  };
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('timer-sync', update);
  }
  if (compactWindow && !compactWindow.isDestroyed()) {
    compactWindow.webContents.send('timer-sync', update);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'ultraPOMODORO365plus',
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 650,
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../src/assets/icon.ico'),
  });

  // Ielādēt lietotni
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  // Atvērt DevTools izstrādes režīmā
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Sūtīt taimera stāvokli, kad galvenais logs ir gatavs
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      broadcastTimerUpdate();
    }, 500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createCompactWindow() {
  compactWindow = new BrowserWindow({
    title: 'ultraPOMODORO365plus - Compact',
    width: 320,
    height: 160,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../src/assets/icon.ico'),
  });

  compactWindow.loadURL(
    isDev
      ? 'http://localhost:5173/compact'
      : `file://${path.join(__dirname, '../dist/compact.html')}`
  );

  if (isDev) {
    compactWindow.webContents.openDevTools();
  }

  // Agresīvs sinhronizācijas paņēmiens - Sūtīt taimera stāvokli, kad kompaktais logs ir gatavs
  compactWindow.webContents.once('did-finish-load', () => {
    const currentState = {
      timeLeft: timerState.timeLeft,
      isRunning: timerState.isRunning,
      isWorkPhase: timerState.isWorkPhase
    };
    
    // Sūtīt stāvokli nekavējoties, vairākas reizes, lai nodrošinātu, ka tas pārraksta inicializāciju
    compactWindow.webContents.send('timer-sync', currentState);
    
    setTimeout(() => {
      compactWindow.webContents.send('timer-sync', currentState);
    }, 100);
    
    setTimeout(() => {
      compactWindow.webContents.send('timer-sync', currentState);
    }, 500);
    
    setTimeout(() => {
      compactWindow.webContents.send('timer-sync', currentState);
    }, 1000);
  });

  compactWindow.on('closed', () => {
    compactWindow = null;
    // Rādīt galveno logu, kad kompaktais logs ir aizvērts
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  // Remove the application menu completely
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC apstrādātājs, lai minimizētu galveno logu un rādītu kompakto taimeri
ipcMain.on('minimize-timer', () => {
  // Iestatīt karogu, lai novērstu taimera stāvokļa traucējumus
  isMinimizeRestoreInProgress = true;
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
    createCompactWindow(); 
  }
  
  // Notīrīt karogu pēc īsa aiztura, lai ļautu kompaktajam logam ielādēties
  setTimeout(() => {
    isMinimizeRestoreInProgress = false;
  }, 1000);
});

// IPC apstrādātājs taimera kontroles komandām
ipcMain.on('timer-control', (_, command) => {
  switch (command) {
    case 'restore':
      // Iestatīt karogu, lai novērstu taimera stāvokļa traucējumus atjaunošanas laikā
      isMinimizeRestoreInProgress = true;
      
      // Aizvērt kompakto logu un rādīt galveno logu
      if (compactWindow && !compactWindow.isDestroyed()) {
        compactWindow.close();
        compactWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
      
      // Notīrīt karogu pēc īsa aiztura
      setTimeout(() => {
        isMinimizeRestoreInProgress = false;
      }, 500);
      break;
    case 'start':
      startTimer();
      break;
    case 'pause':
      pauseTimer();
      break;
    case 'stop':
    case 'reset':
      resetTimer();
      break;
  }
});

// IPC apstrādātājs taimera stāvokļa atjauninājumiem no renderētāja
ipcMain.on('timer-update', (_, timeLeft, isRunning) => {
  updateTimerState(timeLeft, isRunning);
});

// IPC apstrādātājs taimera iestatījumu atjauninājumiem no renderētāja
ipcMain.on('timer-settings-update', (_, workDuration, breakDuration) => {
  updateTimerSettings(workDuration, breakDuration);
});