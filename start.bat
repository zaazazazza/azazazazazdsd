@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

if not exist ".env" (
  echo [ERREUR] Le fichier .env est introuvable.
  echo Copie les valeurs dans .env puis relance start.bat.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] npm est introuvable. Installe Node.js puis relance ce fichier.
  pause
  exit /b 1
)

echo Demarrage du bot Discord...
call npm start
echo.
echo Le bot Discord s'est arrete. Code retour: %ERRORLEVEL%
pause
