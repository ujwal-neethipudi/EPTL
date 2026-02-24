#!/bin/bash
# Double-click to regenerate the map JSON from map_data.xlsx (or map_data.csv).
# Then commit and push in GitHub Desktop to publish changes.
# Uses Node (no Python required). Run Setup.command once if you haven't run npm install.

cd "$(dirname "$0")"

if ! command -v npm &>/dev/null; then
  echo "Node/npm not found. Install Node from https://nodejs.org"
  read -p "Press Enter to close."
  exit 1
fi

npm run update-map
EXIT=$?

if [ $EXIT -eq 0 ]; then
  echo ""
  echo "Done. Open GitHub Desktop, commit the changed files, and push to publish."
else
  echo ""
  echo "If dependencies are missing, run Setup.command once (or: npm install)."
fi
read -p "Press Enter to close."
