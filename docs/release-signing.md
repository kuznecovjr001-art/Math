# Подпись релиза и сборка для RuStore (делает владелец)

Ключ подписи — единственный способ выпускать обновления. Потеря ключа = смена подписи через поддержку RuStore
и повторная загрузка. Ключ, пароли и их копии **никогда** не кладутся в репозиторий, логи, чаты и CI.

## 1. Окружение (один раз)

- Node 22+, JDK 21 (например, Temurin 21), Android SDK с `platforms;android-36`.
- В `android/local.properties` (файл в `.gitignore`): `sdk.dir=C\:/Users/<вы>/AppData/Local/Android/Sdk`.

## 2. Создать ключ (один раз, на своём компьютере)

```bash
keytool -genkeypair -v -keystore schitalochka-release.jks -alias schitalochka -keyalg RSA -keysize 4096 -validity 10000
```

Храните `schitalochka-release.jks` и пароли минимум в двух местах (например, менеджер паролей + зашифрованный
носитель). Вне папки репозитория.

## 3. Собрать подписанный APK

PowerShell:

```powershell
$env:SCHITALOCHKA_KEYSTORE="D:\keys\schitalochka-release.jks"
$env:SCHITALOCHKA_KEY_ALIAS="schitalochka"
$env:SCHITALOCHKA_STORE_PASSWORD="<пароль хранилища>"
$env:SCHITALOCHKA_KEY_PASSWORD="<пароль ключа>"
npm ci; npm run build; npx cap sync android
cd android; .\gradlew.bat assembleRelease
```

Результат: `android/app/build/outputs/apk/release/app-release.apk`. Без переменных получится
`app-release-unsigned.apk` — его в RuStore не загружать.

Проверка подписи и версии:

```bash
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
aapt2 dump badging android/app/build/outputs/apk/release/app-release.apk | head -3
```

## 4. Перед загрузкой

- `versionCode` в `android/app/build.gradle` больше, чем у прошлой загрузки; `versionName` — видимая версия.
- `appId` `io.github.kuznecovjr001_art.schitalochka` после первой публикации менять нельзя — подтвердите его.
- Формат: APK со своим ключом (рекомендован RuStore для локально хранимого сертификата). AAB возможен,
  но требует ключа загрузки и выгрузки подписи через `pepk` — см. docs/rustore-checklist.md.
- Debug-APK (`app-debug.apk`) не загружать: подписан отладочным ключом, RuStore его отклонит.
