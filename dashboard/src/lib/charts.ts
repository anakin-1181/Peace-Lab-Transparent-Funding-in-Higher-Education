import type { DashboardData, DepartmentBreakdown, NamedValue, SankeyLink, SankeyNode } from '../types';

export type OverviewModel = {
  year: string;
  income: NamedValue[];
  expenditure: NamedValue[];
  totalIncome: number;
  totalExpenditure: number;
  netPosition: number;
  nodes: SankeyNode[];
  links: SankeyLink[];
};

function toNodes(unique: string[]) {
  return unique.map((name) => ({ name }));
}

function uniqueNodeNames(links: SankeyLink[]) {
  return [...new Set(links.flatMap((link) => [link.source, link.target]))];
}

export function buildOverviewModel(data: DashboardData, year: string): OverviewModel {
  const baseline = data.table1.byYear[year];

  if (!baseline) {
    throw new Error(`No Table 1 data found for ${year}.`);
  }

  const income = [
    { name: 'Tuition fees and education contracts', value: baseline.tuitionFeesAndEducationContracts },
    { name: 'Funding body grants', value: baseline.fundingBodyGrants },
    { name: 'Research grants and contracts', value: baseline.researchGrantsAndContracts },
    { name: 'Other income', value: baseline.otherIncome },
    { name: 'Investment income', value: baseline.investmentIncome },
    { name: 'Donations and endowments', value: baseline.donationsAndEndowments }
  ];

  const totalIncome = baseline.totalIncome;
  const expenditure = [
    { name: 'Staff costs', value: baseline.staffCosts },
    { name: 'Restructuring costs', value: baseline.restructuringCosts },
    { name: 'Other operating expenses', value: baseline.otherOperatingExpenses },
    { name: 'Depreciation and amortisation', value: baseline.depreciationAndAmortisation },
    { name: 'Interest and other finance costs', value: baseline.interestAndOtherFinanceCosts }
  ];

  const totalExpenditure = baseline.totalExpenditure;
  const netPosition = totalIncome - totalExpenditure;

  const links: SankeyLink[] = [];

  for (const item of income) {
    if (item.value > 0) {
      links.push({ source: item.name, target: 'Total income', value: item.value });
    }
  }

  links.push({ source: 'Total income', target: 'Total expenditure', value: Math.max(totalExpenditure, 0) });

  if (netPosition >= 0) {
    links.push({ source: 'Total income', target: 'Surplus', value: netPosition });
  } else {
    links.push({ source: 'Deficit', target: 'Total income', value: Math.abs(netPosition) });
  }

  for (const item of expenditure) {
    if (item.value > 0) {
      links.push({ source: 'Total expenditure', target: item.name, value: item.value });
    }
  }

  return {
    year: baseline.academicYear,
    income,
    expenditure,
    totalIncome,
    totalExpenditure,
    netPosition,
    links,
    nodes: toNodes(uniqueNodeNames(links))
  };
}

export function buildTuitionBreakdown(data: DashboardData, year: string): NamedValue[] {
  const t6 = data.table6.byYear[year];

  if (!t6) {
    return [];
  }

  const nonUkFees = t6.totalNonUkFees > 0 ? t6.totalNonUkFees : t6.totalEuFees + t6.totalNonEuFees;

  const slices = [
    { name: 'UK fees', value: t6.totalUkFees },
    { name: 'Non-UK fees', value: nonUkFees },
    { name: 'Research training support grants', value: t6.totalResearchTrainingSupportGrants },
    { name: 'Non-credit bearing course fees', value: t6.nonCreditBearingCourseFees },
    { name: 'FE course fees', value: t6.feCourseFees }
  ];

  return slices.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
}

export function buildTuitionDomicileBreakdown(data: DashboardData, year: string): NamedValue[] {
  const t6 = data.table6.byYear[year];

  if (!t6) {
    return [];
  }

  const detailed = [
    { name: 'Home fees', value: t6.totalHomeFees },
    { name: 'Rest of UK fees', value: t6.totalRestOfUkFees },
    { name: 'EU fees', value: t6.totalEuFees },
    { name: 'Non-EU fees', value: t6.totalNonEuFees }
  ].filter((item) => item.value > 0);

  if (detailed.length > 0) {
    return detailed.sort((a, b) => b.value - a.value);
  }

  // Some providers only have UK/non-UK totals populated in Table 6.
  const fallback = [
    { name: 'UK fees', value: t6.totalUkFees },
    { name: 'Non-UK fees', value: t6.totalNonUkFees }
  ];

  return fallback.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
}

export function buildResearchSourceBreakdown(data: DashboardData, year: string): NamedValue[] {
  return data.table5.byYear[year]?.sources ?? [];
}

export function buildExpenditureBreakdown(data: DashboardData, year: string): NamedValue[] {
  const t8 = data.table8.byYear[year];

  if (!t8) {
    return [];
  }

  return [
    { name: 'Academic staff costs', value: t8.academicStaffCosts },
    { name: 'Other staff costs', value: t8.otherStaffCosts },
    { name: 'Restructuring costs', value: t8.restructuringCosts },
    { name: 'Other operating expenses', value: t8.otherOperatingExpenses },
    { name: 'Depreciation and amortisation', value: t8.depreciationAndAmortisation },
    { name: 'Interest and finance costs', value: t8.interestAndOtherFinanceCosts }
  ].filter((item) => item.value > 0);
}

export function buildStaffCostBreakdown(data: DashboardData, year: string): NamedValue[] {
  const t8 = data.table8.byYear[year];

  if (!t8) {
    return [];
  }

  return [
    { name: 'Academic staff costs', value: t8.academicStaffCosts },
    { name: 'Other staff costs', value: t8.otherStaffCosts }
  ].filter((item) => item.value > 0);
}

export function buildDepartmentSankey(
  department: DepartmentBreakdown
) {
  const deptNode = `${department.code} ${department.name}`;
  const deptTotalNode = '15 Total research grants and contracts';
  const adjustmentNode = 'Net adjustments';

  const links: SankeyLink[] = [];
  let sourceTotal = 0;

  for (const source of department.sources) {
    sourceTotal += source.value;
    links.push({
      source: source.name,
      target: deptNode,
      value: source.value
    });
  }

  const residual = department.total - sourceTotal;
  if (residual > 0) {
    links.push({ source: adjustmentNode, target: deptNode, value: residual });
  } else if (residual < 0) {
    links.push({ source: deptNode, target: adjustmentNode, value: Math.abs(residual) });
  }

  links.push({ source: deptNode, target: deptTotalNode, value: department.total });

  return {
    deptNode,
    nodes: toNodes(uniqueNodeNames(links)),
    links
  };
}

export function buildDepartmentComparison(data: DashboardData, year: string): NamedValue[] {
  const rows = data.table5.byYear[year]?.departments ?? [];
  return rows
    .map((department) => ({
      name: `${department.code} ${department.name}`,
      value: department.total
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}
