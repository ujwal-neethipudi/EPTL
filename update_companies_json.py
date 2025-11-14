#!/usr/bin/env python3
"""Update companies.json to include HQ data from CSV"""
import json
import csv
from pathlib import Path
from collections import defaultdict

csv_path = Path('map_data_demo.csv')
json_path = Path('public/companies.json')

print(f'Reading CSV: {csv_path}')

# Read CSV
companies_by_category = defaultdict(list)

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        entity = row.get('Entity', '').strip()
        domain = row.get('Domain', '').strip()
        description = row.get('Description', '').strip()
        category = row.get('Map Bucket 1 (Normalized)', '').strip()
        hq = row.get('HQ', '').strip()
        
        if not entity or not category:
            continue
        
        company = {
            'name': entity,
            'domain': domain if domain else '',
            'description': description if description else ''
        }
        
        # Only add hq if it exists and is not empty
        if hq:
            company['hq'] = hq
        
        companies_by_category[category].append(company)

# Convert to regular dict and sort
result = dict(sorted(companies_by_category.items()))

# Write JSON
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'✅ Updated {json_path} with HQ data')
print(f'Total categories: {len(result)}')
total_companies = sum(len(items) for items in result.values())
companies_with_hq = sum(1 for items in result.values() for item in items if 'hq' in item)
print(f'Total companies: {total_companies}')
print(f'Companies with HQ: {companies_with_hq}')

