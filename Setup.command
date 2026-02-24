#!/bin/bash
# First-time setup: installs Node dependencies so "Update map" can read map_data.xlsx.
# Run this once (double-click or from Terminal). No Python required.

cd "$(dirname "$0")"

if command -v npm &>/dev/null; then
  npm install
  echo "Setup complete. You can now use 'Update map.command' after editing the Excel file."
else
  echo "Node/npm not found. Install Node from https://nodejs.org"
fi
echo ""
read -p "Press Enter to close."
