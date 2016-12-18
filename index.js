'use strict';

process.on('uncaughtException', (error) =>
{
    process.emitWarning(`Uncaught exception: ${error}`);
    process.exit(1);
});

const {ipcMain, app, BrowserWindow} = require('electron');

const oQuickConfig = {
    bReload : true,
    bLoadExternalApps: false
}

const WINDOW_MIN_WIDTH = 800;
const WINDOW_MIN_HEIGHT = 600;
const WINDOW_DEFAULT_WIDTH = 900;
const WINDOW_DEFAULT_HEIGHT = 700;

//cannot use while importing apps
if (oQuickConfig.bReload)
{
    require('electron-reload')(__dirname);
}

// prevent window being garbage collected
let mainWindow;

function onClosed()
{
    // dereference the window
    // for multiple windows store them in an array
    mainWindow = null;
}

function createMainWindow()
{
    const win = new BrowserWindow({
        minWidth: WINDOW_MIN_WIDTH,
        minHeight: WINDOW_MIN_HEIGHT,
        width: WINDOW_DEFAULT_WIDTH,
        height: WINDOW_DEFAULT_HEIGHT,
        autoHideMenuBar: true,
        title: 'IBClient'
    });

    win.setMenu(null);
    win.webContents.openDevTools()

    win.loadURL(`file://${__dirname}/index.html`);
    win.on('closed', onClosed);

    ipcMain.on('request-app-paths', (event, args) => {
        event.returnValue = {
            APPLICATION_APP_DATA_PATH : app.getPath("userData"),
            APPLICATION_APP_BASE_PATH : __dirname
        };
    });

    ipcMain.on('should-load-external-apps', (event, args) => {
        event.returnValue = {
            bLoadExternalApps: false
        };
    });

    ipcMain.on("restart", (event, args) =>
    {
        app.relaunch();
        app.quit();
    })

    return win;
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (!mainWindow) {
        mainWindow = createMainWindow();
    }
});

app.on('ready', () => {
    mainWindow = createMainWindow();
});

