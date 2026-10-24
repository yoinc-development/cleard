const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MACHO_64_LE = 0xfeedfacf;

function isMachO(file) {
    const fd = fs.openSync(file, 'r');
    try {
        const buf = Buffer.alloc(4);
        if (fs.readSync(fd, buf, 0, 4, 0) < 4) return false;
        return buf.readUInt32LE(0) === MACHO_64_LE;
    } finally {
        fs.closeSync(fd);
    }
}

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(full);
        else if (entry.isFile()) yield full;
    }
}

function codesign(target, ...extra) {
    execFileSync('codesign', ['--force', '--sign', '-', ...extra, target], {stdio: 'inherit'});
}

exports.default = async function adhocSign(context) {
    if (context.electronPlatformName !== 'darwin') return;

    const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
    const jreDir = path.join(appPath, 'Contents', 'Resources', 'jre');

    for (const file of walk(jreDir)) {
        if (isMachO(file)) codesign(file);
    }
    codesign(appPath, '--deep');
    execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {stdio: 'inherit'});
};
