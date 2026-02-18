@echo off
chcp 65001 >nul
echo ========================================
echo ЭТАП 1: Резервное копирование
echo ========================================
echo.

:: Переход в директорию проекта
cd /d "%~dp0"

echo Создание папок backup...
if not exist "backup\pre-mobile-update" mkdir "backup\pre-mobile-update"
if not exist "archive\messenger-prototypes" mkdir "archive\messenger-prototypes"
if not exist "templates" mkdir "templates"

echo.
echo Копирование файлов в backup...
copy /Y "index.html" "backup\pre-mobile-update\index.html.bak"
copy /Y "styles.css" "backup\pre-mobile-update\styles.css.bak"
copy /Y "app.js" "backup\pre-mobile-update\app.js.bak"

echo.
echo Перемещение старых прототипов в archive...
move /Y "messenger_prototype_v*.html" "archive\messenger-prototypes\" 2>nul

echo.
echo ========================================
echo Резервное копирование завершено!
echo ========================================
echo.
echo Созданные файлы:
echo   - backup/pre-mobile-update/index.html.bak
echo   - backup/pre-mobile-update/styles.css.bak
echo   - backup/pre-mobile-update/app.js.bak
echo.
echo Архивированные файлы:
dir /b "archive\messenger-prototypes" 2>nul
echo.
echo ========================================
echo.
echo Следующий шаг: Этап 2 - Модернизация index.html
echo Выполните: copy templates\template-mobile.html index_new.html
echo.
pause
