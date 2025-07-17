const { app, BrowserWindow, Menu, shell, ipcMain, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');

// Конфигурация автообновлений
autoUpdater.checkForUpdatesAndNotify();

// Логирование автообновлений
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;

// Создание главного окна
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../src/assets/icon.ico'),
        show: false,
        titleBarStyle: 'default'
    });

    // Загрузка приложения
    const startUrl = isDev 
        ? 'http://localhost:5173' 
        : `file://${path.join(__dirname, '../dist/index.html')}`;
    
    mainWindow.loadURL(startUrl);

    // Показать окно когда готово
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Проверить обновления только в продакшене
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    // Открытие внешних ссылок в браузере
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // DevTools только в разработке
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Создание меню
    createMenu();
}

// Создание меню приложения
function createMenu() {
    const template = [
        {
            label: 'Файл',
            submenu: [
                {
                    label: 'Проверить обновления',
                    click: () => {
                        autoUpdater.checkForUpdatesAndNotify();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Выход',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Вид',
            submenu: [
                { role: 'reload', label: 'Перезагрузить' },
                { role: 'forceReload', label: 'Принудительная перезагрузка' },
                { role: 'toggleDevTools', label: 'Инструменты разработчика' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Обычный размер' },
                { role: 'zoomIn', label: 'Увеличить' },
                { role: 'zoomOut', label: 'Уменьшить' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Полный экран' }
            ]
        },
        {
            label: 'Помощь',
            submenu: [
                {
                    label: 'О приложении',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'О приложении',
                            message: 'ultraPOMODORO365plus',
                            detail: `Версия: ${app.getVersion()}\nПродуктивный таймер по технике Помодоро`
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// События автообновлений
autoUpdater.on('checking-for-update', () => {
    console.log('Проверка обновлений...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Обновление доступно:', info.version);
    
    // Показать уведомление
    if (Notification.isSupported()) {
        new Notification({
            title: 'Доступно обновление',
            body: `Новая версия ${info.version} скачивается...`,
            icon: path.join(__dirname, '../src/assets/icon.ico')
        }).show();
    }

    // Отправить в рендер процесс
    if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
    }
});

autoUpdater.on('update-not-available', (info) => {
    console.log('Обновления не найдены');
});

autoUpdater.on('error', (err) => {
    console.error('Ошибка автообновления:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = "Скорость загрузки: " + progressObj.bytesPerSecond;
    logMessage = logMessage + ' - Загружено ' + progressObj.percent + '%';
    logMessage = logMessage + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(logMessage);

    // Отправить прогресс в рендер процесс
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Обновление скачано:', info.version);
    
    // Показать диалог с предложением перезапуска
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Обновление готово',
        message: 'Обновление скачано и готово к установке',
        detail: `Новая версия ${info.version} будет установлена после перезапуска приложения.`,
        buttons: ['Перезапустить сейчас', 'Перезапустить позже'],
        defaultId: 0
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

// IPC обработчики
ipcMain.handle('check-for-updates', async () => {
    if (!isDev) {
        return await autoUpdater.checkForUpdatesAndNotify();
    }
    return null;
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// События приложения
app.whenReady().then(() => {
    createWindow();

    // macOS - создать окно если нет открытых
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Закрытие приложения
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Безопасность
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

// Автообновления при запуске (только в продакшене)
app.on('ready', () => {
    if (!isDev) {
        // Проверить обновления через 10 секунд после запуска
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 10000);

        // Проверять обновления каждые 30 минут
        setInterval(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 30 * 60 * 1000);
    }
});