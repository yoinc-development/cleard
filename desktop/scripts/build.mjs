import {execFileSync} from 'node:child_process';
import {existsSync, rmSync, mkdirSync, readdirSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(desktopDir, '..');
const resourcesDir = path.join(desktopDir, 'resources');

const appVersionFlagIndex = process.argv.indexOf('--app-version');
const appVersion = appVersionFlagIndex !== -1 ? process.argv[appVersionFlagIndex + 1] : null;
if (appVersionFlagIndex !== -1 && !appVersion) {
    console.error('error: --app-version requires a value');
    process.exit(1);
}

function run(cmd, args, cwd, opts = {}) {
    console.log(`\n==> ${cmd} ${args.join(' ')}`);
    execFileSync(cmd, args, {cwd, stdio: 'inherit', ...opts});
}

function requireOnPath(cmd, hint) {
    try {
        execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {stdio: 'ignore'});
    } catch {
        console.error(`error: ${cmd} not found on PATH. ${hint}`);
        process.exit(1);
    }
}

requireOnPath('jlink', "jlink ships with the JDK (bin/jlink) - add that JDK's bin directory to PATH.");
const mvnw = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
run(mvnw, ['-Ppackage', 'clean', 'package'], repoRoot, {shell: process.platform === 'win32'});

const targetDir = path.join(repoRoot, 'target');
const jarName = readdirSync(targetDir).find((f) => f.endsWith('.jar') && !f.endsWith('.original'));
if (!jarName) {
    console.error('error: could not find the packaged jar under target/ - did the package build succeed?');
    process.exit(1);
}
const jarPath = path.join(targetDir, jarName);
console.log(`\n==> Found jar: ${jarPath}`);
rmSync(resourcesDir, {recursive: true, force: true});
mkdirSync(resourcesDir, {recursive: true});
copyFileSync(jarPath, path.join(resourcesDir, 'cleard.jar'));

const jreDir = path.join(resourcesDir, 'jre');
run(
    'jlink',
    [
        '--add-modules', 'java.se,jdk.crypto.ec,jdk.unsupported,jdk.management',
        '--strip-debug',
        '--no-header-files',
        '--no-man-pages',
        '--output', jreDir,
    ],
    desktopDir,
);

const electronBuilderCli = path.join(desktopDir, 'node_modules', 'electron-builder', 'cli.js');
if (!existsSync(electronBuilderCli)) {
    console.error('error: electron-builder not found - run `npm ci` in desktop/ first.');
    process.exit(1);
}
let platformArgs;
if (process.platform === 'win32') {
    platformArgs = ['--win', 'nsis'];
} else if (process.platform === 'darwin') {
    platformArgs = ['--mac', 'dmg', `--${process.arch}`];
} else {
    console.error(`error: packaging is not supported on ${process.platform}.`);
    process.exit(1);
}
const electronBuilderArgs = [...platformArgs, '--publish', 'never'];
if (appVersion) {
    electronBuilderArgs.push('-c.extraMetadata.version=' + appVersion);
}
run(process.execPath, [electronBuilderCli, ...electronBuilderArgs], desktopDir);

console.log('\n==> Installer written to target/dist');
