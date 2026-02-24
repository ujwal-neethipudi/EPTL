@echo off
REM First-time setup: installs Node dependencies so "Update map" can read map_data.xlsx.
REM Run this once (double-click or from Command Prompt). No Python required.

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node/npm not found. Install Node from https://nodejs.org
  pause
  exit /b 1
)
npm install
echo Setup complete. You can now use "Update map.bat" after editing the Excel file.
pause
