import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(ROOT, '..', 'Data');
const OUT_FILE = path.join(ROOT, 'public', 'ucl-data.json');

const TABLE1_FILE_CANDIDATES = [
  'table-1.csv',
  'Table 1 - Consolidated statement of comprehensive income and expenditure 2015:16 to 2024:25.csv'
];
const TABLE5_DIR_CANDIDATES = ['table-5', 'table-5 (1)'];
const TABLE6_DIR_CANDIDATES = ['table-6'];
const TABLE8_DIR_CANDIDATES = [
  'table-8',
  'Table 8 - Expenditure - breakdown by HE provider, activity, HESA cost centre and academic year 2015:16 to 2024:25.csv'
];

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

const TABLE1_FIELD_MAP = {
  'Income|Tuition fees and education contracts': 'tuitionFeesAndEducationContracts',
  'Income|Funding body grants': 'fundingBodyGrants',
  'Income|Research grants and contracts': 'researchGrantsAndContracts',
  'Income|Other income': 'otherIncome',
  'Income|Investment income': 'investmentIncome',
  'Income|Donations and endowments': 'donationsAndEndowments',
  'Income|Total income': 'totalIncome',
  'Expenditure|Staff costs': 'staffCosts',
  'Expenditure|Restructuring costs': 'restructuringCosts',
  'Expenditure|Other operating expenses': 'otherOperatingExpenses',
  'Expenditure|Depreciation and amortisation': 'depreciationAndAmortisation',
  'Expenditure|Interest and other finance costs': 'interestAndOtherFinanceCosts',
  'Expenditure|Total expenditure': 'totalExpenditure'
};

const TABLE8_ACTIVITY_MAP = {
  'Academic staff costs': 'academicStaffCosts',
  'Other staff costs': 'otherStaffCosts',
  'Total staff costs': 'totalStaffCosts',
  'Restructuring costs': 'restructuringCosts',
  'Other operating expenses': 'otherOperatingExpenses',
  'Depreciation and amortisation': 'depreciationAndAmortisation',
  'Interest and other finance costs': 'interestAndOtherFinanceCosts',
  'Total expenditure': 'totalExpenditure'
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
  const stripped = value.replace(/[(),\s]/g, '');
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
    return '';
  }

  const start = year - 1;
  const end2 = String(year).slice(2);
  return `${start}/${end2}`;
}

function academicYearFromFilename(fileName) {
  const name = cleanCell(fileName).toLowerCase();

  const long = name.match(/(20\d{2})[-/](\d{2})/);
  if (long) {
    return `${long[1]}/${long[2]}`;
  }

  const short = name.match(/_(\d{2})(\d{2})\.csv$/);
  if (short) {
    const startYear = 2000 + Number(short[1]);
    return `${startYear}/${short[2]}`;
  }

  return '';
}

function yearSort(a, b) {
  return Number(a.slice(0, 4)) - Number(b.slice(0, 4));
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

function getAny(row, idx, keys) {
  for (const key of keys) {
    const value = get(row, idx, key);
    if (cleanCell(value) !== '') {
      return value;
    }
  }
  return '';
}

function ensureYearMapRows(yearsMap) {
  const years = [...yearsMap.keys()].sort(yearSort);
  const byYear = Object.fromEntries(years.map((year) => [year, yearsMap.get(year)]));
  return { years, byYear };
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

function createTable1YearRow({ ukprn, provider, financialYearEnd, academicYear }) {
  return {
    ukprn,
    provider,
    financialYearEnd,
    academicYear,
    tuitionFeesAndEducationContracts: 0,
    fundingBodyGrants: 0,
    researchGrantsAndContracts: 0,
    otherIncome: 0,
    investmentIncome: 0,
    donationsAndEndowments: 0,
    totalIncome: 0,
    staffCosts: 0,
    restructuringCosts: 0,
    otherOperatingExpenses: 0,
    depreciationAndAmortisation: 0,
    interestAndOtherFinanceCosts: 0,
    totalExpenditure: 0
  };
}

function createTable8YearRow({ ukprn, provider, financialYearEnd, academicYear }) {
  return {
    ukprn,
    provider,
    financialYearEnd,
    academicYear,
    academicStaffCosts: 0,
    otherStaffCosts: 0,
    totalStaffCosts: 0,
    restructuringCosts: 0,
    otherOperatingExpenses: 0,
    depreciationAndAmortisation: 0,
    interestAndOtherFinanceCosts: 0,
    totalExpenditure: 0
  };
}

function resolveExistingFile(baseDir, candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(baseDir, candidate);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  throw new Error(`No expected file found in ${baseDir}. Tried: ${candidates.join(', ')}`);
}

function resolveExistingDir(baseDir, candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(baseDir, candidate);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return fullPath;
    }
  }
  throw new Error(`No expected directory found in ${baseDir}. Tried: ${candidates.join(', ')}`);
}

async function parseTable1() {
  const filePath = resolveExistingFile(SOURCE_DIR, TABLE1_FILE_CANDIDATES);
  const byYear = new Map();

  await walkCsvRows(filePath, (row, idx) => {
    const ukprn = get(row, idx, 'UKPRN');
    const provider = getAny(row, idx, ['HE Provider', 'HE provider']);

    if (ukprn !== UCL_UKPRN && provider !== UCL_NAME) {
      return;
    }

    const year = cleanCell(get(row, idx, 'Academic year'));
    if (!year) {
      return;
    }

    if (!isYearMonthAll(get(row, idx, 'Year End Month'))) {
      return;
    }

    if (!byYear.has(year)) {
      byYear.set(
        year,
        createTable1YearRow({
          ukprn,
          provider: provider || UCL_NAME,
          financialYearEnd: cleanCell(getAny(row, idx, ['Financial Year End', 'Financial year end'])),
          academicYear: year
        })
      );
    }

    const item = byYear.get(year);
    if (!item.financialYearEnd) {
      item.financialYearEnd = cleanCell(getAny(row, idx, ['Financial Year End', 'Financial year end']));
    }

    const marker = cleanCell(get(row, idx, 'Category marker'));
    const category = cleanCell(get(row, idx, 'Category'));
    const key = TABLE1_FIELD_MAP[`${marker}|${category}`];

    if (!key) {
      return;
    }

    item[key] = toNumber(get(row, idx, 'Value(£000s)'));
  });

  if (!byYear.size) {
    throw new Error(`No UCL year data found in ${filePath}`);
  }

  return ensureYearMapRows(byYear);
}

async function parseTable6() {
  const dirPath = resolveExistingDir(SOURCE_DIR, TABLE6_DIR_CANDIDATES);
  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.toLowerCase().endsWith('.csv'))
    .sort();

  const byYear = new Map();

  for (const file of files) {
    const filePath = path.join(dirPath, file);

    await walkCsvRows(filePath, (row, idx) => {
      const ukprn = get(row, idx, 'UKPRN');
      const provider = getAny(row, idx, ['HE Provider', 'HE provider']);

      if (ukprn !== UCL_UKPRN && provider !== UCL_NAME) {
        return;
      }

      const financialYearEnd = cleanCell(getAny(row, idx, ['Financial Year End', 'Financial year end']));
      const academicYear =
        cleanCell(get(row, idx, 'Academic year')) ||
        academicYearFromDate(financialYearEnd) ||
        academicYearFromFilename(file);

      if (!academicYear) {
        return;
      }

      byYear.set(academicYear, {
        ukprn,
        provider: provider || UCL_NAME,
        financialYearEnd,
        academicYear,
        totalHomeFees: toNumber(get(row, idx, 'Total Home fees')),
        totalRestOfUkFees: toNumber(get(row, idx, 'Total Rest of UK fees')),
        totalUkFees: toNumber(get(row, idx, 'Total UK fees')),
        totalEuFees: toNumber(get(row, idx, 'Total EU fees')),
        totalUkAndEuFees: toNumber(get(row, idx, 'Total UK and EU fees')),
        totalNonEuFees: toNumber(get(row, idx, 'Total Non-EU fees')),
        totalNonUkFees: toNumber(get(row, idx, 'Total Non-UK fees')),
        totalHeCourseFees: toNumber(get(row, idx, 'Total HE course fees')),
        totalResearchTrainingSupportGrants: toNumber(get(row, idx, 'Total research training support grants')),
        nonCreditBearingCourseFees: toNumber(get(row, idx, 'Non-credit bearing course fees')),
        feCourseFees: toNumber(get(row, idx, 'FE course fees')),
        totalTuitionFeesAndEducationContracts: toNumber(get(row, idx, 'Total tuition fees and education contracts')),
        contractedOutActivityFeeIncome: toNumber(
          getAny(row, idx, [
            'Of which: Net fee income relating to contracted out activity',
            'Of which: Net fee income relating to contracted out activity '
          ])
        )
      });
    });
  }

  if (!byYear.size) {
    throw new Error(`No UCL rows found in ${dirPath}`);
  }

  return ensureYearMapRows(byYear);
}

async function parseTable8() {
  const pathCandidate = path.join(SOURCE_DIR, TABLE8_DIR_CANDIDATES[0]);

  if (fs.existsSync(pathCandidate) && fs.statSync(pathCandidate).isDirectory()) {
    const files = fs
      .readdirSync(pathCandidate)
      .filter((file) => file.toLowerCase().endsWith('.csv'))
      .sort();

    const byYear = new Map();

    for (const file of files) {
      const filePath = path.join(pathCandidate, file);

      await walkCsvRows(filePath, (row, idx) => {
        const ukprn = get(row, idx, 'UKPRN');
        const provider = getAny(row, idx, ['HE provider', 'HE Provider']);

        if (ukprn !== UCL_UKPRN && provider !== UCL_NAME) {
          return;
        }

        const yearEndMonth = get(row, idx, 'Year End Month');
        if (!isYearMonthAll(yearEndMonth)) {
          return;
        }

        const hesaCostCentre = cleanCell(get(row, idx, 'HESA cost centre'));
        const academicDepartments = cleanCell(get(row, idx, 'Academic departments'));
        if (hesaCostCentre !== 'Total expenditure' || academicDepartments !== 'Total expenditure') {
          return;
        }

        const activity = cleanCell(get(row, idx, 'Activity'));
        const fieldKey = TABLE8_ACTIVITY_MAP[activity];
        if (!fieldKey) {
          return;
        }

        const financialYearEnd = cleanCell(getAny(row, idx, ['Financial year end', 'Financial Year End']));
        const academicYear =
          cleanCell(get(row, idx, 'Academic year')) ||
          academicYearFromDate(financialYearEnd) ||
          academicYearFromFilename(file);

        if (!academicYear) {
          return;
        }

        if (!byYear.has(academicYear)) {
          byYear.set(
            academicYear,
            createTable8YearRow({
              ukprn,
              provider: provider || UCL_NAME,
              financialYearEnd,
              academicYear
            })
          );
        }

        const yearRow = byYear.get(academicYear);
        if (!yearRow.financialYearEnd) {
          yearRow.financialYearEnd = financialYearEnd;
        }

        yearRow[fieldKey] = toNumber(get(row, idx, 'Value(£000s)'));
      });
    }

    if (!byYear.size) {
      throw new Error(`No UCL rows found in ${pathCandidate}`);
    }

    return ensureYearMapRows(byYear);
  }

  const singleFilePath = resolveExistingFile(SOURCE_DIR, TABLE8_DIR_CANDIDATES.slice(1));
  const byYear = new Map();

  await walkCsvRows(singleFilePath, (row, idx) => {
    const ukprn = get(row, idx, 'UKPRN');
    const provider = getAny(row, idx, ['HE provider', 'HE Provider']);

    if (ukprn !== UCL_UKPRN && provider !== UCL_NAME) {
      return;
    }

    const academicYear =
      cleanCell(get(row, idx, 'Academic year')) ||
      academicYearFromDate(getAny(row, idx, ['Financial year end', 'Financial Year End']));

    if (!academicYear) {
      return;
    }

    const yearEndMonth = get(row, idx, 'Year End Month');
    if (!isYearMonthAll(yearEndMonth)) {
      return;
    }

    const hesaCostCentre = cleanCell(get(row, idx, 'HESA cost centre'));
    const academicDepartments = cleanCell(get(row, idx, 'Academic departments'));
    if (hesaCostCentre !== 'Total expenditure' || academicDepartments !== 'Total expenditure') {
      return;
    }

    const activity = cleanCell(get(row, idx, 'Activity'));
    const fieldKey = TABLE8_ACTIVITY_MAP[activity];
    if (!fieldKey) {
      return;
    }

    if (!byYear.has(academicYear)) {
      byYear.set(
        academicYear,
        createTable8YearRow({
          ukprn,
          provider: provider || UCL_NAME,
          financialYearEnd: cleanCell(getAny(row, idx, ['Financial year end', 'Financial Year End'])),
          academicYear
        })
      );
    }

    const yearRow = byYear.get(academicYear);
    yearRow[fieldKey] = toNumber(get(row, idx, 'Value(£000s)'));
  });

  if (!byYear.size) {
    throw new Error(`No UCL rows found in ${singleFilePath}`);
  }

  return ensureYearMapRows(byYear);
}

async function parseTable5() {
  const table5Dir = resolveExistingDir(SOURCE_DIR, TABLE5_DIR_CANDIDATES);
  const files = fs
    .readdirSync(table5Dir)
    .filter((file) => file.toLowerCase().endsWith('.csv'))
    .sort();

  const byYear = new Map();

  for (const file of files) {
    const filePath = path.join(table5Dir, file);

    await walkCsvRows(filePath, (row, idx) => {
      const ukprn = get(row, idx, 'UKPRN');
      const provider = getAny(row, idx, ['HE provider', 'HE Provider']);

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

      const isTotalResearchMarker =
        marker.includes('Total research grants and contracts') ||
        costCentre.includes('Total research grants and contracts');

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

  const years = [...byYear.keys()].sort(yearSort);
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
    if (fs.existsSync(OUT_FILE)) {
      console.warn(
        `[build:data] Data directory not found (${SOURCE_DIR}). ` +
          `Using existing prebuilt dataset at ${OUT_FILE}.`
      );
      return;
    }

    throw new Error(
      `Data directory not found: ${SOURCE_DIR}. ` +
        `No prebuilt dataset found at ${OUT_FILE}.`
    );
  }

  const table1 = await parseTable1();
  const table6 = await parseTable6();
  const table8 = await parseTable8();
  const table5 = await parseTable5();

  const baselineYear = table1.years[table1.years.length - 1] ?? '';

  const output = {
    generatedAt: new Date().toISOString(),
    provider: {
      ukprn: UCL_UKPRN,
      name: UCL_NAME
    },
    notes: {
      overviewBaselineYear: baselineYear,
      overviewMethod:
        'Overview Sankey uses exact Table 1 values for the selected academic year. Available years come directly from the loaded files; no extrapolation is applied.'
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
