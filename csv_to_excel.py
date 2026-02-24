#!/usr/bin/env python3
"""One-time: create map_data.xlsx from map_data.csv so the map can use Excel as source."""
import csv
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print('Install openpyxl first: pip install -r requirements-data.txt')
    raise

BASE_DIR = Path(__file__).resolve().parent
csv_path = BASE_DIR / 'map_data.csv'
excel_path = BASE_DIR / 'map_data.xlsx'

if not csv_path.exists():
    print(f'Not found: {csv_path}')
    exit(1)

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Map data'

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    for row_idx, row in enumerate(reader, start=1):
        for col_idx, value in enumerate(row, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)

wb.save(excel_path)
print(f'Created: {excel_path}')
print('You can now edit the Excel file and run "Update map" to regenerate the JSON.')
