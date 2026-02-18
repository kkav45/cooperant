@echo off
echo Проверка целостности информационной системы учета пайщиков кооператива
echo ======================================================================

setlocal enabledelayedexpansion

set "required_files=index.html styles.css app.js README.md"
set "optional_files=Техническая_спецификация_информационной_системы_учета_пайщиков_кооператива.md demo_data.json data_structure.md backup_instructions.md error_guide.md expansion_opportunities.md testing_plan.md deployment_guide.md user_manual.md system_overview.md file_catalog.md architecture_documentation.md start.bat"

echo.
echo Проверка обязательных файлов:
echo ------------------------------

set "missing_count=0"

for %%f in (%required_files%) do (
    if exist "%%f" (
        echo [OK] %%f
    ) else (
        echo [ОШИБКА] Отсутствует обязательный файл: %%f
        set /a missing_count+=1
    )
)

echo.
echo Проверка дополнительных файлов:
echo -------------------------------

for %%f in (%optional_files%) do (
    if exist "%%f" (
        echo [OK] %%f
    ) else (
        echo [ПРЕДУПРЕЖДЕНИЕ] Отсутствует дополнительный файл: %%f
    )
)

echo.
if !missing_count! gtr 0 (
    echo Найдено !missing_count! отсутствующих обязательных файлов.
    echo Система НЕ может работать корректно.
    pause
    exit /b 1
) else (
    echo Все обязательные файлы на месте.
    echo Система готова к использованию.
)

echo.
echo Проверка завершена.
pause