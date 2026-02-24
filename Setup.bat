@echo off
REM First-time setup: installs the Excel helper so "Update map" can read map_data.xlsx.
REM Run this once (double-click or from Command Prompt).

cd /d "%~dp0"

python -m venv .venv-data
if errorlevel 1 (
  echo Python not found. Install Python from https://www.python.org/downloads/
  pause
  exit /b 1
)
.venv-data\Scripts\pip install -q -r requirements-data.txt
echo Setup complete. You can now use "Update map.bat" after editing the Excel file.
pause
