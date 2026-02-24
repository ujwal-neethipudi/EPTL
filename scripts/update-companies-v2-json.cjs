/**
 * Update public/companiesV2.json from map_data.xlsx (or map_data.csv).
 * Same logic as update_companies_v2_json.py – no Python required.
 * Run: node scripts/update-companies-v2-json.cjs
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const excelPath = path.join(BASE_DIR, 'map_data.xlsx');
const csvPath = path.join(BASE_DIR, 'map_data.csv');
const jsonPath = path.join(BASE_DIR, 'public', 'companiesV2.json');

function normalize(val) {
  if (val == null) return '';
  return String(val).trim();
}

function getDataRows() {
  if (fs.existsSync(excelPath)) {
    const XLSX = require('xlsx');
    const wb = XLSX.readFile(excelPath);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) return [];
    const headers = rows[0].map(h => normalize(h));
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = normalize(row[i]); });
      return obj;
    });
  }
  if (fs.existsSync(csvPath)) {
    const { parse } = require('csv-parse/sync');
    const text = fs.readFileSync(csvPath, 'utf8');
    const records = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true });
    return records.map(r => {
      const obj = {};
      for (const k of Object.keys(r)) obj[k] = normalize(r[k]);
      return obj;
    });
  }
  throw new Error('Neither map_data.xlsx nor map_data.csv found');
}

const categoryToPillar = {
  'Research & Intelligence': ['Brain', 'Research & Intelligence'],
  'Strategy & Creative Production': ['Brain', 'Strategy & Creative Production'],
  'Field & Mobilization': ['Engine', null],
  'Campaign Management & CRM': ['Engine', null],
  'Fundraising & Payments': ['Engine', null],
  'Organisational Infrastructure': ['Engine', 'Organizational Infrastructure'],
  'Digital Comms & Advertising': ['Megaphone', 'Digital Communications and Advertising'],
  'Information Integrity & Defense': ['Megaphone', null],
  'Social Media & Management': ['Megaphone', null],
  'Participation & Election Tech': ['Megaphone', null],
};

const dataSource = fs.existsSync(excelPath) ? excelPath : csvPath;
console.log('Reading:', dataSource);

const companiesByPillar = {
  Brain: {
    'Research & Intelligence': {},
    'Strategy & Creative Production': {},
  },
  Engine: {},
  Megaphone: {},
};
const digitalCommsSubcats = {};

for (const row of getDataRows()) {
  const entity = normalize(row.Entity);
  const domain = normalize(row.Domain);
  const description = normalize(row.Description);
  const category = normalize(row.Category);
  const subcategory = normalize(row['Sub Category']);
  const hq = normalize(row.HQ);
  const logo = normalize(row.Logo);
  const hubUrl = normalize(row['Hub URL'] || row.hub_url || '');

  if (!entity || !category) continue;

  const company = {
    name: entity,
    domain: domain || '',
    description: description || '',
  };
  if (hq) company.hq = hq;
  if (logo) company.logo = logo;
  if (hubUrl) company.hub_url = hubUrl;

  const [pillar, pillarCategory] = categoryToPillar[category] || [null, null];
  if (!pillar) {
    console.warn(`Warning: Category "${category}" not mapped to any pillar`);
    continue;
  }

  if (pillar === 'Brain') {
    if (pillarCategory) {
      if (subcategory) {
        if (!companiesByPillar.Brain[pillarCategory][subcategory]) companiesByPillar.Brain[pillarCategory][subcategory] = [];
        companiesByPillar.Brain[pillarCategory][subcategory].push(company);
      } else {
        console.warn(`Warning: ${entity} in ${category} has no subcategory`);
      }
    }
  } else if (pillar === 'Engine') {
    if (pillarCategory) {
      if (subcategory) {
        if (!companiesByPillar.Engine['Organizational Infrastructure']) companiesByPillar.Engine['Organizational Infrastructure'] = {};
        if (!companiesByPillar.Engine['Organizational Infrastructure'][subcategory]) companiesByPillar.Engine['Organizational Infrastructure'][subcategory] = [];
        companiesByPillar.Engine['Organizational Infrastructure'][subcategory].push(company);
      } else {
        console.warn(`Warning: ${entity} in ${category} has no subcategory`);
      }
    } else {
      if (!companiesByPillar.Engine[category]) companiesByPillar.Engine[category] = [];
      companiesByPillar.Engine[category].push(company);
    }
  } else if (pillar === 'Megaphone') {
    if (category === 'Digital Comms & Advertising') {
      if (subcategory) {
        if (!digitalCommsSubcats[subcategory]) digitalCommsSubcats[subcategory] = [];
        digitalCommsSubcats[subcategory].push(company);
      } else {
        console.warn(`Warning: ${entity} in Digital Comms & Advertising has no subcategory`);
      }
    } else if (category === 'Participation & Election Tech') {
      if (subcategory) {
        if (!companiesByPillar.Megaphone['Participation & Election Tech']) companiesByPillar.Megaphone['Participation & Election Tech'] = {};
        if (!companiesByPillar.Megaphone['Participation & Election Tech'][subcategory]) companiesByPillar.Megaphone['Participation & Election Tech'][subcategory] = [];
        companiesByPillar.Megaphone['Participation & Election Tech'][subcategory].push(company);
      } else {
        if (!companiesByPillar.Megaphone['Participation & Election Tech']) companiesByPillar.Megaphone['Participation & Election Tech'] = [];
        companiesByPillar.Megaphone['Participation & Election Tech'].push(company);
      }
    }
  }
}

const engineOrder = ['Field & Mobilization', 'Campaign Management & CRM', 'Fundraising & Payments', 'Organizational Infrastructure'];

const result = {
  Brain: {},
  Engine: {},
  Megaphone: {},
};

for (const [cat, subcats] of Object.entries(companiesByPillar.Brain)) {
  result.Brain[cat] = subcats;
}

for (const key of engineOrder) {
  if (!(key in companiesByPillar.Engine)) continue;
  const value = companiesByPillar.Engine[key];
  result.Engine[key] = value;
}

if (Object.keys(digitalCommsSubcats).length) {
  result.Megaphone['Digital Communications and Advertising'] = {};
  for (const [subcat, companies] of Object.entries(digitalCommsSubcats)) {
    if (companies.length) result.Megaphone['Digital Communications and Advertising'][subcat] = companies;
  }
}

for (const [key, value] of Object.entries(companiesByPillar.Megaphone)) {
  if (key === 'Digital Communications and Advertising') continue;
  result.Megaphone[key] = value;
}

fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');

console.log('✅ Updated', jsonPath);
console.log('Total pillars:', Object.keys(result).length);
for (const [pillar, categories] of Object.entries(result)) {
  console.log('\n' + pillar + ' pillar:');
  for (const [cat, subcatsOrCompanies] of Object.entries(categories)) {
    if (typeof subcatsOrCompanies === 'object' && subcatsOrCompanies !== null && !Array.isArray(subcatsOrCompanies)) {
      console.log('  ' + cat + ':');
      for (const [subcat, companies] of Object.entries(subcatsOrCompanies)) {
        console.log('    - ' + subcat + ': ' + companies.length + ' companies');
      }
    } else {
      console.log('  ' + cat + ': ' + subcatsOrCompanies.length + ' companies');
    }
  }
}
