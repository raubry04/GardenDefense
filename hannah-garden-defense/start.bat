@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ===================================
echo   Hannah's Garden Defense
echo   http://localhost:5050
echo ===================================

echo.
echo Checking port 5050...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" -Port 5050
if errorlevel 1 (
  echo PowerShell port check failed; trying netstat fallback...
  for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5050" ^| findstr "LISTENING"') do (
    if not "%%p"=="0" (
      echo Stopping prior server (PID %%p^)...
      taskkill /F /PID %%p >nul 2>&1
    )
  )
  timeout /t 1 /nobreak >nul
)

if not exist "dist\index.html" (
  echo Building game first...
  call npm run build
  if errorlevel 1 exit /b 1
)
if not exist "assets\animals\rabbit.png" (
  echo Collecting assets...
  call npm run assets
  if errorlevel 1 exit /b 1
)

echo.
echo Starting server...
node server\index.js
pause
