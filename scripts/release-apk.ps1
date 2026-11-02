# Подписанный APK для RuStore одной командой (запускает владелец у себя в терминале):
#   powershell -ExecutionPolicy Bypass -File scripts\release-apk.ps1
# При первом запуске создаёт ключ в папке пользователя, вне репозитория. Пароли спрашиваются здесь и никуда не пишутся.
# Подробности и резервная копия ключа: docs/release-signing.md.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = Join-Path $HOME 'dev-tools\jdk-21.0.12.1+1' }
$keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'

function Read-Secret($prompt) {
  $s = Read-Host $prompt -AsSecureString
  $p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($p) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }
}

if (-not $env:SCHITALOCHKA_KEYSTORE) {
  $dir = Join-Path $HOME 'schitalochka-keys'
  New-Item -ItemType Directory -Force $dir | Out-Null
  $env:SCHITALOCHKA_KEYSTORE = Join-Path $dir 'schitalochka-release.jks'
}
if (-not $env:SCHITALOCHKA_KEY_ALIAS) { $env:SCHITALOCHKA_KEY_ALIAS = 'schitalochka' }

if (-not (Test-Path $env:SCHITALOCHKA_KEYSTORE)) {
  Write-Host "Ключа ещё нет. keytool спросит пароль и данные о владельце, ключ будет здесь: $env:SCHITALOCHKA_KEYSTORE"
  & $keytool -genkeypair -v -keystore $env:SCHITALOCHKA_KEYSTORE -alias $env:SCHITALOCHKA_KEY_ALIAS -keyalg RSA -keysize 4096 -validity 10000
  if ($LASTEXITCODE) { throw 'Ключ не создан' }
  Write-Host 'Сохраните этот файл и пароль минимум в двух местах: без них обновления выпустить нельзя.'
}
if (-not $env:SCHITALOCHKA_STORE_PASSWORD) { $env:SCHITALOCHKA_STORE_PASSWORD = Read-Secret 'Пароль ключа' }
if (-not $env:SCHITALOCHKA_KEY_PASSWORD) { $env:SCHITALOCHKA_KEY_PASSWORD = $env:SCHITALOCHKA_STORE_PASSWORD }

Set-Location $root
npm run build
if ($LASTEXITCODE) { throw 'Веб-сборка не прошла' }
npx cap sync android
if ($LASTEXITCODE) { throw 'Синхронизация Android не прошла' }
Set-Location android
.\gradlew.bat assembleRelease
if ($LASTEXITCODE) { throw 'Сборка APK не прошла' }
Set-Location $root

$apk = 'android\app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path $apk)) { throw 'Подписанного APK нет: проверьте ключ и пароль' }
$out = Join-Path $HOME 'Downloads\Schitalochka-release.apk'
Copy-Item $apk $out -Force
Write-Host "Готово: $out — этот файл загружается в RuStore Консоль."
