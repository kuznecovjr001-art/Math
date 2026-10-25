---
name: math-android-qa
description: "Проверка Android-функций и сборки. Используй при задачах Math, связанных с этой областью."
---
# math-android-qa

1. Проверить выбранную версию Capacitor с установленным Node/Gradle/JDK/Android SDK по текущей документации.
2. Сборка debug APK, запуск, возврат Android Back, resume после сворачивания, поворот, safe areas и системная клавиатура.
3. Cold start без сети, ресурсы изображений и озвучки из локального bundle; web/PWA режим не ломается.
4. Логировать реальные версии ОС и устройств и доказательства прохождения native tests. При отсутствии SDK явно указать BLOCKED.
5. Отключить debug в release и проверить manifest/permissions.
