@echo off
REM Double-click to regenerate the map JSON from map_data.xlsx (or map_data.csv).
REM Then commit and push in GitHub Desktop to publish changes.

cd /d "%~dp0"

if exist ".venv-data\Scripts\python.exe" (
  set PY=.venv-data\Scripts\python.exe
) else (
  set PY=python
)

"%PY%" update_companies_v2_json.py
if %ERRORLEVEL% equ 0 (
  echo.
  echo Done. Open GitHub Desktop, commit the changed files, and push to publish.
)
pause
