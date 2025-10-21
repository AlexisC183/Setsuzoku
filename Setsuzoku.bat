@echo off
chcp 65001
title Setsuzoku - Servidor Node.js
echo =================================
echo    SETSUZOKU - Bolsa de Trabajo
echo =================================
echo.
echo Iniciando servidor...
echo.

cd /d %~dp0

REM Verificar si hay un proceso Node.js usando el puerto 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Terminando proceso con PID %%a que usa el puerto 8000...
    taskkill /F /PID %%a
)

REM Mensaje informativo sobre sesiones temporales
echo.
echo NOTA: Las sesiones son temporales y se cerraran al terminar el servidor.
echo.

REM Abrir navegador automáticamente después de un pequeño retraso
start /min cmd /c timeout /t 2 ^&^& start http://localhost:8000

REM Iniciar servidor en primer plano (no en segundo plano)
echo Presiona Ctrl+C para detener el servidor
node backend/server.js

echo.
echo Servidor detenido - Todas las sesiones han sido cerradas
echo =================================
echo.
pause