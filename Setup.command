#!/bin/bash
# First-time setup: installs the Excel helper so "Update map" can read map_data.xlsx.
# Run this once (double-click or from Terminal).

cd "$(dirname "$0")"

if command -v python3 &>/dev/null; then
  python3 -m venv .venv-data
  .venv-data/bin/pip install -q -r requirements-data.txt
  echo "Setup complete. You can now use 'Update map.command' after editing the Excel file."
else
  echo "Python 3 not found. Install Python from https://www.python.org/downloads/"
fi
echo ""
read -p "Press Enter to close."
