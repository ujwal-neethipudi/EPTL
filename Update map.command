#!/bin/bash
# Double-click to regenerate the map JSON from map_data.xlsx (or map_data.csv).
# Then commit and push in GitHub Desktop to publish changes.

cd "$(dirname "$0")"

PYTHON=""
if [ -x ".venv-data/bin/python" ]; then
  PYTHON=".venv-data/bin/python"
elif command -v python3 &>/dev/null; then
  PYTHON="python3"
else
  echo "Python 3 not found. Install Python from python.org"
  exit 1
fi

$PYTHON update_companies_v2_json.py
EXIT=$?

if [ $EXIT -eq 0 ]; then
  echo ""
  echo "Done. Open GitHub Desktop, commit the changed files, and push to publish."
fi
read -p "Press Enter to close."
