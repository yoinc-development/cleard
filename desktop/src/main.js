// electron main process

const {app, BrowserWindow, Menu, shell} = require('electron');
const {spawn} = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');

const HEALTH_TIMEOUT_MS = 60_000;
const HEALTH_POLL_INTERVAL_MS = 500;
const STDERR_TAIL_LINES = 200;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let mainWindow = null;
let backendProcess = null;
let quitting = false;
const stderrTail = [];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveBackendPaths() {
    const base = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', 'resources');
    const javaBin = process.platform === 'win32' ? 'java.exe' : 'java';
    return {
        javaPath: path.join(base, 'jre', 'bin', javaBin),
        jarPath: path.join(base, 'cleard.jar'),
    };
}

function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const {port} = server.address();
            server.close(() => resolve(port));
        });
    });
}

function captureStderr(child) {
    child.stderr.on('data', (chunk) => {
        for (const line of chunk.toString('utf8').split('\n')) {
            if (line.length === 0) continue;
            stderrTail.push(line);
            if (stderrTail.length > STDERR_TAIL_LINES) stderrTail.shift();
        }
    });
}

function spawnBackend(javaPath, jarPath, port) {
    const child = spawn(
        javaPath,
        [
            '-Dspring.devtools.restart.enabled=false',
            '-jar',
            jarPath,
            `--server.port=${port}`,
            '--server.address=127.0.0.1',
            `--cleard.app-version=${app.getVersion()}`,
        ],
        {stdio: ['ignore', 'pipe', 'pipe']},
    );
    captureStderr(child);
    child.on('exit', (code, signal) => {
        backendProcess = null;
        if (quitting) return;
        // A startup-time exit is reported by the waitForHealth race in startBackend
        // instead, so only report here once the app has actually started.
        if (!mainWindow) return;
        showFatalError(
            new Error(`Backend process exited unexpectedly (code=${code}, signal=${signal})`),
            'cleard stopped unexpectedly',
        );
        mainWindow.destroy();
    });
    return child;
}

async function waitForHealth(baseUrl, timeoutMs) {
    const healthUrl = `${baseUrl.replace(/\/+$/, '')}/actuator/health`;
    const deadline = Date.now() + timeoutMs;
    let lastError = null;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(healthUrl);
            if (response.ok) {
                const body = await response.json();
                if (body.status === 'UP') return;
            }
        } catch (err) {
            lastError = err;
        }
        await sleep(HEALTH_POLL_INTERVAL_MS);
    }
    throw new Error(
        `Backend did not become healthy within ${timeoutMs}ms` +
        (lastError ? ` (last error: ${lastError.message})` : ''),
    );
}

async function startBackend() {
    const devUrl = process.env.CLEARD_BACKEND_URL;
    if (devUrl) {
        await waitForHealth(devUrl, 30_000);
        return devUrl;
    }

    const {javaPath, jarPath} = resolveBackendPaths();
    if (!fs.existsSync(javaPath)) {
        throw new Error(`Bundled JRE not found at ${javaPath}`);
    }
    if (!fs.existsSync(jarPath)) {
        throw new Error(`Backend jar not found at ${jarPath}`);
    }

    const port = await getFreePort();
    backendProcess = spawnBackend(javaPath, jarPath, port);
    const child = backendProcess;

    const exitedEarly = new Promise((resolve, reject) => {
        child.once('exit', (code, signal) => {
            reject(new Error(`Backend exited during startup (code=${code}, signal=${signal})`));
        });
    });

    const url = `http://127.0.0.1:${port}/`;
    await Promise.race([waitForHealth(url, HEALTH_TIMEOUT_MS), exitedEarly]);
    return url;
}

async function stopBackend() {
    const child = backendProcess;
    if (!child) return;

    const exited = new Promise((resolve) => child.once('exit', resolve));

    if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
        killer.on('error', (err) => {
            console.error('taskkill failed to start:', err);
        });
    } else {
        child.kill('SIGTERM');
    }

    const timedOut = await Promise.race([
        exited.then(() => false),
        sleep(SHUTDOWN_TIMEOUT_MS).then(() => true),
    ]);
    if (timedOut) {
        console.error(`Backend did not exit within ${SHUTDOWN_TIMEOUT_MS}ms; quitting anyway`);
    }
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function showFatalError(err, heading = 'cleard failed to start') {
    const win = new BrowserWindow({width: 640, height: 400, title: 'cleard'});
    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;padding:16px;">
<h2 style="margin-top:0;">${escapeHtml(heading)}</h2>
<pre style="white-space:pre-wrap;">${escapeHtml(String((err && err.stack) || err))}</pre>
${stderrTail.length ? `<h3>Backend output (last ${stderrTail.length} lines)</h3><pre style="white-space:pre-wrap;font-size:12px;">${escapeHtml(stderrTail.join('\n'))}</pre>` : ''}
</body></html>`;
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function installApplicationMenu() {
    if (process.platform !== 'darwin') {
        Menu.setApplicationMenu(null);
        return;
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: app.name,
            submenu: [
                {
                    label: `About ${app.name}`, click: () => {

                    },
                    role: 'about'
                },
                {type: 'separator'},
                {
                    label: 'Preferences…',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript("location.hash = '#/settings'");
                        }
                    },
                },
                {type: 'separator'},
                {role: 'quit', label: `Quit ${app.name}`},
            ],
        },
        {role: 'editMenu'},
        {role: 'windowMenu'},
    ]));
}

function createWindow(url) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: 'cleard',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.webContents.setWindowOpenHandler(({url: targetUrl}) => {
        if (/^https:\/\//.test(targetUrl)) shell.openExternal(targetUrl);
        return {action: 'deny'};
    });
    mainWindow.loadURL(url);
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(async () => {
        installApplicationMenu();

        try {
            const url = await startBackend();
            createWindow(url);
        } catch (err) {
            showFatalError(err);
        }

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
                app.quit();
            }
        });
    });

    app.on('window-all-closed', () => {
        app.quit();
    });

    app.on('before-quit', (event) => {
        if (quitting || !backendProcess) return;
        quitting = true;
        event.preventDefault();
        stopBackend().finally(() => app.quit());
    });
}
