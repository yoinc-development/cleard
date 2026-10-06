const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('cleardShell', {
    platform: process.platform,
    setTheme: ({background, foreground, colorScheme}) => {
        ipcRenderer.send('theme-changed', {background, foreground, colorScheme});
    },
});
