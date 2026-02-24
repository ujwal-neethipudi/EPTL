@echo off
REM Double-click to regenerate the map JSON from map_data.xlsx (or map_data.csv).
REM Then commit and push in GitHub Desktop to publish changes.
REM Uses Node (no Python required). Run Setup.bat once if you haven't run npm install.

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node/npm not found. Install Node from https://nodejs.org
  pause
  exit /b 1
)

npm run update-map
if %ERRORLEVEL% equ 0 (
  echo.
  echo Done. Open GitHub Desktop, commit the changed files, and push to publish.
) else (
  echo.
  echo If dependencies are missing, run Setup.bat once (or: npm install).
)
pause
