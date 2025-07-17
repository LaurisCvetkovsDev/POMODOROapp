const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
let isDev = false;

try {
  isDev = require('electron-is-dev');
} catch (_) {
  isDev = false;
}

// Настройка автоматических обновлений
function setupAutoUpdater() {
  // Отключаем автоматические обновления в режиме разработки
  if (isDev) {
    console.log('Автообновления отключены в режиме разработки');
    return;
  }

  // Настройка логирования для отладки
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // Настройка событий обновлений
  autoUpdater.on('checking-for-update', () => {
    console.log('Проверка обновлений...');
    sendStatusToWindow('Проверка обновлений...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Доступно обновление:', info);
    sendStatusToWindow('Доступно обновление! Загрузка...');
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Обновлений не найдено:', info);
    sendStatusToWindow('Обновлений не найдено');
  });

  autoUpdater.on('error', (err) => {
    console.log('Ошибка при обновлении:', err);
    sendStatusToWindow('Ошибка при обновлении: ' + err.message);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Скорость загрузки: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Загружено ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
    sendStatusToWindow(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Обновление загружено:', info);
    sendStatusToWindow('Обновление загружено. Перезапуск приложения...');
    
    // Автоматически устанавливаем обновление через 1 секунду
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 1000);
  });

  // Проверяем обновления при запуске (с задержкой в 3 секунды)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
}

// Функция для отправки статуса в окно приложения
function sendStatusToWindow(text) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', text);
  }
  if (compactWindow && !compactWindow.isDestroyed()) {
    compactWindow.webContents.send('update-status', text);
  }
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
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
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
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
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
  setupAutoUpdater(); // Вызываем функцию настройки обновлений
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

// IPC обработчики для обновлений
ipcMain.on('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.on('download-update', () => {
  if (!isDev) {
    autoUpdater.downloadUpdate();
  }
});

ipcMain.on('install-update', () => {
  if (!isDev) {
    autoUpdater.quitAndInstall();
  }
});

// Получение информации о текущей версии
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Получение информации о доступных обновлениях
ipcMain.handle('get-update-info', () => {
  return {
    version: app.getVersion(),
    isDev: isDev
  };
});