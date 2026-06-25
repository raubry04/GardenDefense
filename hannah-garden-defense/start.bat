@echo off
cd /d "%~dp0"
echo ===================================
echo   Hannah's Garden Defense
echo   http://localhost:5050
echo ===================================
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
node server\index.js
pause
