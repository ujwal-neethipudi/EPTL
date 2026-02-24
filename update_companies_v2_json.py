#!/usr/bin/env python3
"""Update companiesV2.json from map_data.xlsx (or map_data.csv) with 3-pillar structure"""
import json
import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent
excel_path = BASE_DIR / 'map_data.xlsx'
csv_path = BASE_DIR / 'map_data.csv'
json_path = BASE_DIR / 'public' / 'companiesV2.json'


def _normalize(val):
    """Normalize cell value to string, strip, empty string if None."""
    if val is None:
        return ''
    s = str(val).strip()
    return s


def get_data_rows():
    """Yield dicts of row data. Prefer Excel if present, else CSV."""
    if excel_path.exists():
        try:
            import openpyxl
        except ImportError:
            print('Excel file found but openpyxl not installed. Run: pip install -r requirements-data.txt')
            raise
        wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            wb.close()
            return
        headers = [_normalize(h) for h in rows[0]]
        for row in rows[1:]:
            d = {headers[i]: _normalize(row[i]) if i < len(row) else '' for i in range(len(headers))}
            yield d
        wb.close()
        return
    # Fallback: CSV
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield {k: (v or '').strip() if isinstance(v, str) else _normalize(v) for k, v in row.items()}


# Choose source for logging
_data_source = excel_path if excel_path.exists() else csv_path
print(f'Reading: {_data_source}')

# Define pillar structure mapping
# Category -> (Pillar, Category Name in Pillar)
category_to_pillar = {
    'Research & Intelligence': ('Brain', 'Research & Intelligence'),
    'Strategy & Creative Production': ('Brain', 'Strategy & Creative Production'),
    'Field & Mobilization': ('Engine', None),  # None means it's a direct category
    'Campaign Management & CRM': ('Engine', None),
    'Fundraising & Payments': ('Engine', None),
    'Organisational Infrastructure': ('Engine', 'Organizational Infrastructure'),  # Note: spelling difference
    'Digital Comms & Advertising': ('Megaphone', 'Digital Communications and Advertising'),  # Note: name difference
    'Information Integrity & Defense': ('Megaphone', None),  # Direct category
    'Social Media & Management': ('Megaphone', None),  # Direct category - but check if it's part of Digital Comms
    'Participation & Election Tech': ('Megaphone', None),
}

# Special handling: Some categories in CSV map differently
# "Digital Comms & Advertising" has subcategories, but "Information Integrity & Defense" 
# and "Social Media & Management" are shown separately in the structure
# Based on the structure:
# - Digital Comms & Advertising -> Digital Advertising & Targeting, Multi-channel Messaging
# - Information Integrity & Defense -> separate (11)
# - Social Media & Management -> separate (9)

# Read CSV
companies_by_pillar = {
    'Brain': {
        'Research & Intelligence': defaultdict(list),
        'Strategy & Creative Production': defaultdict(list)
    },
    'Engine': defaultdict(list),  # For direct categories
    'Megaphone': defaultdict(list)  # For direct categories + Digital Comms subcategories
}

# Track all Digital Comms subcategories
digital_comms_subcats = {}

for row in get_data_rows():
    entity = (row.get('Entity') or '').strip()
    domain = (row.get('Domain') or '').strip()
    description = (row.get('Description') or '').strip()
    category = (row.get('Category') or '').strip()
    subcategory = (row.get('Sub Category') or '').strip()
    hq = (row.get('HQ') or '').strip()
    logo = (row.get('Logo') or '').strip()
    hub_url = (row.get('Hub URL') or row.get('hub_url') or '').strip() or ''

    if not entity or not category:
        continue

    company = {
        'name': entity,
        'domain': domain if domain else '',
        'description': description if description else ''
    }

    if hq:
        company['hq'] = hq
    if logo:
        company['logo'] = logo
    if hub_url:
        company['hub_url'] = hub_url

    # Map to pillar structure
    pillar, pillar_category = category_to_pillar.get(category, (None, None))

    if not pillar:
        print(f'Warning: Category "{category}" not mapped to any pillar')
        continue

    if pillar == 'Brain':
        # Brain has nested structure: Category -> Subcategory
        if pillar_category:
            if subcategory:
                companies_by_pillar['Brain'][pillar_category][subcategory].append(company)
            else:
                print(f'Warning: {entity} in {category} has no subcategory')
        else:
            pass
    elif pillar == 'Engine':
        if pillar_category:  # Organizational Infrastructure
            if subcategory:
                if 'Organizational Infrastructure' not in companies_by_pillar['Engine']:
                    companies_by_pillar['Engine']['Organizational Infrastructure'] = defaultdict(list)
                companies_by_pillar['Engine']['Organizational Infrastructure'][subcategory].append(company)
            else:
                print(f'Warning: {entity} in {category} has no subcategory')
        else:
            companies_by_pillar['Engine'][category].append(company)
    elif pillar == 'Megaphone':
        if category == 'Digital Comms & Advertising':
            if subcategory:
                digital_comms_subcats[subcategory] = digital_comms_subcats.get(subcategory, [])
                digital_comms_subcats[subcategory].append(company)
            else:
                print(f'Warning: {entity} in Digital Comms & Advertising has no subcategory')
        elif category == 'Participation & Election Tech':
            if subcategory:
                if 'Participation & Election Tech' not in companies_by_pillar['Megaphone']:
                    companies_by_pillar['Megaphone']['Participation & Election Tech'] = defaultdict(list)
                companies_by_pillar['Megaphone']['Participation & Election Tech'][subcategory].append(company)
            else:
                companies_by_pillar['Megaphone']['Participation & Election Tech'].append(company)

# Build final structure with correct ordering
# Engine order: Field & Mobilization, Campaign Management & CRM, Fundraising & Payments, Organizational Infrastructure
result = {
    'Brain': {},
    'Engine': {},
    'Megaphone': {}
}

# Define correct order for categories within each pillar
engine_order = ['Field & Mobilization', 'Campaign Management & CRM', 'Fundraising & Payments', 'Organizational Infrastructure']

# Brain pillar
for category, subcats in companies_by_pillar['Brain'].items():
    result['Brain'][category] = {}
    for subcat, companies in subcats.items():
        result['Brain'][category][subcat] = companies

# Engine pillar - maintain correct order
for key in engine_order:
    if key not in companies_by_pillar['Engine']:
        continue
    value = companies_by_pillar['Engine'][key]
    if isinstance(value, defaultdict) or isinstance(value, dict):
        # This is Organizational Infrastructure with subcategories
        result['Engine'][key] = {}
        for subcat, companies in value.items():
            result['Engine'][key][subcat] = companies
    else:
        # Direct category (list of companies)
        result['Engine'][key] = value

# Megaphone pillar - handle Digital Comms specially
if digital_comms_subcats:
    result['Megaphone']['Digital Communications and Advertising'] = {}
    for subcat, companies in digital_comms_subcats.items():
        if companies:
            result['Megaphone']['Digital Communications and Advertising'][subcat] = companies

# Add other Megaphone categories
for key, value in companies_by_pillar['Megaphone'].items():
    if key == 'Digital Communications and Advertising':
        continue  # Already handled
    if isinstance(value, defaultdict) or isinstance(value, dict):
        result['Megaphone'][key] = {}
        for subcat, companies in value.items():
            result['Megaphone'][key][subcat] = companies
    else:
        result['Megaphone'][key] = value

# Write JSON
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'✅ Updated {json_path}')
print(f'Total pillars: {len(result)}')

# Print statistics
for pillar, categories in result.items():
    print(f'\n{pillar} pillar:')
    if isinstance(categories, dict):
        for cat, subcats_or_companies in categories.items():
            if isinstance(subcats_or_companies, dict):
                print(f'  {cat}:')
                for subcat, companies in subcats_or_companies.items():
                    print(f'    - {subcat}: {len(companies)} companies')
            else:
                print(f'  {cat}: {len(subcats_or_companies)} companies')
