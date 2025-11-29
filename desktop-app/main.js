const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'icon.png'),
        resizable: true,
        frame: true,
        title: 'AI Chat - LM Studio'
    });

    mainWindow.loadFile('index.html');

    // Open DevTools in development (optional)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
