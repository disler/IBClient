'use strict';
const electron = require('electron');

const {ipcMain} = require('electron');

const app = electron.app;

const oQuickConfig = {
	bReload : false,
}

//cannot use while importing apps
if(oQuickConfig.bReload)
	require('electron-reload')(__dirname);

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 1000,
		height: 800,
		minWidth: 800,
		minHeight: 550,
		devTools : true
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
