import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(ROOT, '..', 'Data');
const TABLE5_DIR = path.join(SOURCE_DIR, 'table-5 (1)');
const OUT_FILE = path.join(ROOT, 'public', 'ucl-data.json');

const UCL_UKPRN = '10007784';
const UCL_NAME = 'University College London';

const SOURCE_GROUP_ALIASES = {
  '2': 'UK Charities (Open)',
  '3': 'UK Charities (Other)',
  '4': 'UK Government & Authorities',
  '5': 'UK R&D Tax Credits',
  '6': 'UK Industry & Commerce',
  '7': 'UK Other Sources',
  '8': 'EU Government Bodies',
  '9': 'EU Charities (Open)',
  '10': 'EU Industry & Commerce',
  '11': 'EU Other Sources',
  '12': 'Non-EU Charities (Open)',
  '13': 'Non-EU Industry & Commerce',
  '14': 'Non-EU Other Sources'
};

function stripBom(value) {
  return value.replace(/^\uFEFF+/, '');
}

function cleanCell(value) {
  return stripBom((value ?? '').trim());
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current);
  return out;
}

function toNumber(raw) {
  const value = cleanCell(raw);
  if (!value) {
    return 0;
  }

  const negative = value.startsWith('(') && value.endsWith(')');
  const stripped = value.replace(/[(),\s]/g, '').replace(/,/g, '');
  const parsed = Number(stripped);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return negative ? -parsed : parsed;
}

function academicYearFromDate(financialYearEnd) {
  const value = cleanCell(financialYearEnd);
  const year = Number(value.slice(0, 4));
  if (!Number.isFinite(year) || year < 2000) {
    return '2023/24';
  }

  const start = year - 1;
  const end2 = String(year).slice(2);
  return `${start}/${end2}`;
}

async function walkCsvRows(filePath, onRow) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = null;
  let headerIndex = null;

  for await (const rawLine of rl) {
    if (!rawLine.trim()) {
      continue;
    }

    const cols = parseCsvLine(rawLine).map(cleanCell);

    if (!header) {
      if (cols[0] === 'UKPRN') {
        header = cols;
        headerIndex = Object.fromEntries(header.map((name, index) => [name, index]));
      }
      continue;
    }

    await onRow(cols, headerIndex);
  }
}

function get(row, idx, key) {
  const i = idx[key];
  if (i === undefined) {
    return '';
  }
  return row[i] ?? '';
}

function sourceCode(sourceName) {
  const match = cleanCell(sourceName).match(/^(\d+[a-z]?)/i);
  return match ? match[1].toLowerCase() : null;
}

function sourceLabel(sourceName) {
  const source = cleanCell(sourceName);
  const code = sourceCode(source);

  if (!code) {
    return null;
  }

  if (code === '1i' || code === '1j') {
    return 'Research Councils Total';
  }

  const numeric = Number(code.replace(/[a-z]/g, ''));
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric >= 2 && numeric <= 14) {
    return SOURCE_GROUP_ALIASES[String(numeric)] ?? source.replace(/^\d+[a-z]?\s*/, '');
  }

  return null;
}

function isYearMonthAll(yearEndMonth) {
  const value = cleanCell(yearEndMonth).toLowerCase();
  return value === '' || value === 'all';
}

function pushOrAdd(map, key, value) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function sortedEntries(map) {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

async function parseSingleRowTable(filePath, numericFields) {
  let rowData = null;

  await walkCsvRows(filePath, (row, idx) => {
    const ukprn = get(row, idx, 'UKPRN');
    const provider = get(row, idx, 'HE Provider') || get(row, idx, 'HE provider');

    if (ukprn !== UCL_UKPRN && provider !== UCL_NAME) {
      return;
    }

    const out = {
      ukprn,
      provider,
      financialYearEnd: get(row, idx, 'Financial Year End') || get(row, idx, 'Financial year end')
    };

    for (const field of numericFields) {
      out[field.key] = toNumber(get(row, idx, field.column));
    }

    rowData = out;
  });

  if (!rowData) {
    throw new Error(`No UCL row found in ${filePath}`);
  }

  return rowData;
}

async function parseTable5() {
  const files = fs
    .readdirSync(TABLE5_DIR)
    .filter((file) => file.toLowerCase().endsWith('.csv'))
    .sort();

  const byYear = new Map();

  for (const file of files) {
    const filePath = path.join(TABLE5_DIR, file);

    await walkCsvRows(filePath, (row, idx) => {
      const ukprn = get(row, idx, 'UKPRN');
      const provider = get(row, idx, 'HE provider');

      if (ukprn !== UCL_UKPRN && provider !== UCL_NAME) {
        return;
      }

      const academicYear = get(row, idx, 'Academic year');
      if (!academicYear) {
        return;
      }

      const yearEndMonth = get(row, idx, 'Year End Month');
      if (!isYearMonthAll(yearEndMonth)) {
        return;
      }

      const marker = get(row, idx, 'HESA cost centre marker');
      const costCentre = get(row, idx, 'HESA cost centre');
      const source = get(row, idx, 'Source of income');
      const value = toNumber(get(row, idx, 'Value(£000s)'));

      if (!byYear.has(academicYear)) {
        byYear.set(academicYear, {
          researchSources: new Map(),
          researchTotal: 0,
          departments: new Map()
        });
      }

      const bucket = byYear.get(academicYear);
      const code = sourceCode(source);
      const label = sourceLabel(source);

      const isTotalResearchMarker = marker.includes('Total research grants and contracts') || costCentre.includes('Total research grants and contracts');

      if (isTotalResearchMarker) {
        if (code === '15') {
          bucket.researchTotal = value;
        } else if (label) {
          pushOrAdd(bucket.researchSources, label, value);
        }
      }

      if (marker !== 'Academic departments') {
        return;
      }

      const deptMatch = costCentre.match(/^(\d{3})\s+(.+)$/);
      if (!deptMatch) {
        return;
      }

      const deptCode = deptMatch[1];
      const deptName = deptMatch[2].trim();
      const deptKey = `${deptCode} ${deptName}`;

      if (!bucket.departments.has(deptKey)) {
        bucket.departments.set(deptKey, {
          code: deptCode,
          name: deptName,
          total: 0,
          sources: new Map()
        });
      }

      const dept = bucket.departments.get(deptKey);

      if (code === '15') {
        dept.total = value;
        return;
      }

      if (!label) {
        return;
      }

      pushOrAdd(dept.sources, label, value);
    });
  }

  const years = [...byYear.keys()].sort((a, b) => Number(a.slice(0, 4)) - Number(b.slice(0, 4)));

  const out = {};

  for (const year of years) {
    const item = byYear.get(year);
    const sources = sortedEntries(item.researchSources);

    if (item.researchTotal === 0) {
      item.researchTotal = sources.reduce((sum, source) => sum + source.value, 0);
    }

    const departments = [...item.departments.values()]
      .map((dept) => {
        const deptSources = sortedEntries(dept.sources);
        const total = dept.total || deptSources.reduce((sum, source) => sum + source.value, 0);

        return {
          code: dept.code,
          name: dept.name,
          total,
          sources: deptSources
        };
      })
      .filter((dept) => dept.total > 0)
      .sort((a, b) => b.total - a.total);

    out[year] = {
      researchTotal: item.researchTotal,
      sources,
      departments
    };
  }

  return { years, byYear: out };
}

async function run() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Data directory not found: ${SOURCE_DIR}`);
  }

  const table1 = await parseSingleRowTable(path.join(SOURCE_DIR, 'Table 1 - Consolidated statement of comprehensive income and expenditure 2015:16 to 2024:25.csv'), [
    { key: 'tuitionFeesAndEducationContracts', column: 'Tuition fees and education contracts' },
    { key: 'fundingBodyGrants', column: 'Funding body grants' },
    { key: 'researchGrantsAndContracts', column: 'Research grants and contracts' },
    { key: 'otherIncome', column: 'Other income' },
    { key: 'investmentIncome', column: 'Investment income' },
    { key: 'donationsAndEndowments', column: 'Donations and endowments' },
    { key: 'totalIncome', column: 'Total income' },
    { key: 'staffCosts', column: 'Staff costs' },
    { key: 'restructuringCosts', column: 'Restructuring costs' },
    { key: 'otherOperatingExpenses', column: 'Other operating expenses' },
    { key: 'depreciationAndAmortisation', column: 'Depreciation and amortisation' },
    { key: 'interestAndOtherFinanceCosts', column: 'Interest and other finance costs' },
    { key: 'totalExpenditure', column: 'Total expenditure' }
  ]);

  table1.academicYear = academicYearFromDate(table1.financialYearEnd);

  const table6 = await parseSingleRowTable(path.join(SOURCE_DIR, 'T6.csv'), [
    { key: 'totalHomeFees', column: 'Total Home fees' },
    { key: 'totalRestOfUkFees', column: 'Total Rest of UK fees' },
    { key: 'totalUkFees', column: 'Total UK fees' },
    { key: 'totalEuFees', column: 'Total EU fees' },
    { key: 'totalUkAndEuFees', column: 'Total UK and EU fees' },
    { key: 'totalNonEuFees', column: 'Total Non-EU fees' },
    { key: 'totalNonUkFees', column: 'Total Non-UK fees' },
    { key: 'totalHeCourseFees', column: 'Total HE course fees' },
    { key: 'totalResearchTrainingSupportGrants', column: 'Total research training support grants' },
    { key: 'nonCreditBearingCourseFees', column: 'Non-credit bearing course fees' },
    { key: 'feCourseFees', column: 'FE course fees' },
    { key: 'totalTuitionFeesAndEducationContracts', column: 'Total tuition fees and education contracts' },
    { key: 'contractedOutActivityFeeIncome', column: 'Of which: Net fee income relating to contracted out activity' }
  ]);

  table6.academicYear = table1.academicYear;

  const table8 = await parseSingleRowTable(path.join(SOURCE_DIR, 'Table 8 - Expenditure - breakdown by HE provider, activity, HESA cost centre and academic year 2015:16 to 2024:25.csv'), [
    { key: 'academicStaffCosts', column: 'Academic staff costs' },
    { key: 'otherStaffCosts', column: 'Other staff costs' },
    { key: 'totalStaffCosts', column: 'Total staff costs' },
    { key: 'restructuringCosts', column: 'Restructuring costs' },
    { key: 'otherOperatingExpenses', column: 'Other operating expenses' },
    { key: 'depreciationAndAmortisation', column: 'Depreciation and amortisation' },
    { key: 'interestAndOtherFinanceCosts', column: 'Interest and other finance costs' },
    { key: 'totalExpenditure', column: 'Total expenditure' }
  ]);

  table8.academicYear = table1.academicYear;

  const table5 = await parseTable5();

  const output = {
    generatedAt: new Date().toISOString(),
    provider: {
      ukprn: UCL_UKPRN,
      name: UCL_NAME
    },
    notes: {
      overviewBaselineYear: table1.academicYear,
      overviewMethod:
        'Overview uses exact values from the single UCL row in Table 1 (academic year 2023/24). No extrapolation is applied.'
    },
    table1,
    table6,
    table8,
    table5
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUT_FILE}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
