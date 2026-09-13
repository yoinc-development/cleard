<#
.SYNOPSIS
  Builds the full cleard app (frontend + backend jar) and wraps it into a Windows
  installer via jpackage.

.DESCRIPTION
  Requires JDK 21+ (jpackage on PATH) and WiX Toolset 3.14 (candle.exe / light.exe
  on PATH) - jpackage delegates to WiX to build .msi / .exe installers on Windows.
  Must be run on Windows; jpackage cannot cross-compile installers from other OSes.

.PARAMETER Type
  Installer type to build: msi (default) or exe.

.EXAMPLE
  ./package-windows.ps1
  ./package-windows.ps1 -Type exe
#>
param(
    [ValidateSet('msi', 'exe')]
    [string]$Type = 'msi'
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

if (-not (Get-Command jpackage -ErrorAction SilentlyContinue)) {
    Write-Error "jpackage not found on PATH. It ships with JDK 21+ (bin\jpackage.exe) - add that JDK's bin directory to PATH."
    exit 1
}

if (-not (Get-Command candle -ErrorAction SilentlyContinue)) {
    Write-Error "WiX Toolset not found on PATH (candle.exe/light.exe). jpackage needs WiX 3.14 to build .$Type installers on Windows. Install it from https://wixtoolset.org/releases/ and add its install directory to PATH, then re-run this script."
    exit 1
}

Write-Host "==> Building frontend and backend jar (mvnw -Ppackage clean package)"
& "$root\mvnw.cmd" -Ppackage clean package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$jar = Get-ChildItem "$root\target" -Filter '*.jar' |
    Where-Object { $_.Name -notmatch '\.original$' } |
    Select-Object -First 1
if (-not $jar) {
    Write-Error "Could not find the packaged jar under target/ - did the package build succeed?"
    exit 1
}

$jpackageInput = Join-Path $root 'target\jpackage-input'
Remove-Item $jpackageInput -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $jpackageInput | Out-Null
Copy-Item $jar.FullName $jpackageInput

$dist = Join-Path $root 'target\dist'
Remove-Item $dist -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $dist | Out-Null

# jpackage / MSI versioning requires a plain x.y.z form - strip -SNAPSHOT etc.
$appVersion = ($jar.BaseName -replace '^cleard-', '') -replace '-SNAPSHOT$', ''
if (-not $appVersion) { $appVersion = '0.0.1' }

Write-Host "==> Running jpackage (type=$Type, version=$appVersion)"
# No --main-class: jpackage would otherwise launch it via `java -cp <jar> <class>`,
# which can't see inside the Spring Boot fat jar's BOOT-INF/ nesting. Omitting it
# makes jpackage use the jar's own Main-Class (Spring's JarLauncher), which reads
# the Start-Class manifest entry (set via pom.xml's mainClass) with the loader that
# understands that layout.
jpackage `
    --type $Type `
    --input $jpackageInput `
    --dest $dist `
    --name cleard `
    --app-version $appVersion `
    --main-jar $jar.Name `
    --win-shortcut `
    --win-menu
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Installer written to $dist"
