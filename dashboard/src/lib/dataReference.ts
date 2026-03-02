export type DataReferenceTable = {
  id: 'table1' | 'table5' | 'table6' | 'table8';
  title: string;
  link: string;
  file: string;
  purpose: string;
  hesaNotes: string[];
  columns: Array<[string, string]>;
};

export const DATA_SOURCE_INFO = {
  organisation: 'HESA - Higher Education Statistics Agency',
  portal: 'https://www.hesa.ac.uk/data-and-analysis/finances',
  type: 'Administrative data from the HESA Finance record (with OfS collection for relevant English providers from 2018/19).',
  providerScope: 'All values displayed in charts are taken from the provided files as reported (£000s), filtered to University College London (UKPRN 10007784).'
} as const;

export const DATA_REFERENCE_TABLES: DataReferenceTable[] = [
  {
    id: 'table1',
    title: 'Table 1 - Consolidated Statement of Comprehensive Income and Expenditure',
    link: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-1',
    file: 'Data/Table 1 - Consolidated statement of comprehensive income and expenditure 2015:16 to 2024:25.csv',
    purpose: 'Primary overview flow used in the main Sankey chart (income to expenditure).',
    hesaNotes: [
      'Prior-year values can be restated in latest submissions; this may cause differences versus corresponding values in Tables 5, 7, 8 and 14.',
      'Staff costs include non-cash pension provision adjustments, which can materially affect apparent surplus/deficit in specific years.',
      'For some years/providers, pension valuation effects created unusually large deficits/surpluses that do not represent normal operating cash performance.',
      'This table is equivalent to a statement of comprehensive income and expenditure (aligned to SORP 2019).',
      'Includes income streams (tuition, grants, research, other, investment, donations) and expenditure streams (staff, restructuring, operating, depreciation, finance costs).',
      'Data is collected retrospectively for the latest year and includes one prior-year comparison that may be restated.'
    ],
    columns: [
      ['UKPRN', 'Provider identifier.'],
      ['HE Provider', 'Provider name.'],
      ['Financial Year End', 'Financial year-end date.'],
      ['Tuition fees and education contracts', 'Income from tuition and education contracts (£000s).'],
      ['Funding body grants', 'Income from funding bodies (£000s).'],
      ['Research grants and contracts', 'Income from research grants/contracts (£000s).'],
      ['Other income', 'Other operating income (£000s).'],
      ['Investment income', 'Investment-related income (£000s).'],
      ['Donations and endowments', 'Donation/endowment income (£000s).'],
      ['Total income', 'Total income (£000s).'],
      ['Staff costs', 'Staff expenditure (£000s).'],
      ['Restructuring costs', 'Restructuring expenditure (£000s).'],
      ['Other operating expenses', 'Other operating expenditure (£000s).'],
      ['Depreciation and amortisation', 'Depreciation/amortisation expenditure (£000s).'],
      ['Interest and other finance costs', 'Finance cost expenditure (£000s).'],
      ['Total expenditure', 'Total expenditure (£000s).']
    ]
  },
  {
    id: 'table6',
    title: 'Table 6 - Tuition Fees and Education Contracts',
    link: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-6',
    file: 'Data/T6.csv',
    purpose: 'Tuition drill-down chart in the overview page.',
    hesaNotes: [
      'Contains tuition fees and education contracts analysed by domicile, mode, level and source of funding.',
      'The “Net fee income relating to contracted out activity” item is newly collected for some providers and may be incomplete; interpret with caution.',
      'Where possible, previous years use restated values; however, some English provider breakdowns (when source of fee is not “Total”) may use originally submitted values.',
      'AFR template changes mean some English providers report non-UK domiciled students as an aggregate rather than separate EU/non-EU in later returns.',
      'Total HE course fees may be zero for providers with no registered students, no charged fees, or wholly subcontracted-in students.',
      'This table excludes subcontracted-in student fee income (found in other finance tables).'
    ],
    columns: [
      ['UKPRN', 'Provider identifier.'],
      ['HE Provider', 'Provider name.'],
      ['Financial Year End', 'Financial year-end date.'],
      ['Total Home fees', 'Home fee total (£000s).'],
      ['Total Rest of UK fees', 'Rest of UK fee total (£000s).'],
      ['Total UK fees', 'UK fee total (£000s).'],
      ['Total EU fees', 'EU fee total (£000s).'],
      ['Total Non-EU fees', 'Non-EU fee total (£000s).'],
      ['Total Non-UK fees', 'Non-UK fee total (£000s).'],
      ['Total HE course fees', 'HE course fee total (£000s).'],
      ['Total research training support grants', 'Research training support grant total (£000s).'],
      ['Non-credit bearing course fees', 'Non-credit fee total (£000s).'],
      ['FE course fees', 'FE course fee total (£000s).'],
      ['Total tuition fees and education contracts', 'Total tuition and education contracts (£000s).']
    ]
  },
  {
    id: 'table5',
    title: 'Table 5 - Research Grants and Contracts by Source and Cost Centre',
    link: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-5',
    file: 'Data/table-5 (1)/table-5-(YYYY-YY).csv',
    purpose: 'Research source drill-down and department-level analysis/ranking.',
    hesaNotes: [
      'Shows research grants/contracts income at granular level by funding source and HESA cost centre.',
      'Excludes research funding from Research England, SFC, HEFCW and DfE (NI).',
      'Uses a matrix structure: funding source columns by activity/cost-centre rows.',
      'Academic departments are mapped to HESA cost centres by providers using their own organisational structures.',
      'Includes externally funded research income, including relevant recovery of indirect costs and in-kind research income where reported.',
      'Includes UK, EU and non-EU source groups with additional conditions for charitable funding categories.'
    ],
    columns: [
      ['UKPRN', 'Provider identifier.'],
      ['HE provider', 'Provider name.'],
      ['Academic year', 'Academic year label.'],
      ['Financial year end', 'Financial year-end date (available in later years).'],
      ['HESA cost centre marker', 'Cost centre grouping context (for example Academic departments).'],
      ['HESA cost centre', 'Specific cost centre (for example 101 Clinical medicine).'],
      ['Source of income', 'Funding source category.'],
      ['Year End Month', 'Month/aggregation marker (All used for dashboard totals).'],
      ['Value(£000s)', 'Reported value in £000s.']
    ]
  },
  {
    id: 'table8',
    title: 'Table 8 - Expenditure Breakdown by Activity and Cost Centre',
    link: 'https://www.hesa.ac.uk/data-and-analysis/finances/table-8',
    file: 'Data/Table 8 - Expenditure - breakdown by HE provider, activity, HESA cost centre and academic year 2015:16 to 2024:25.csv',
    purpose: 'Expenditure drill-down chart in the overview page.',
    hesaNotes: [
      'Table 8 values come from the corresponding collection year and may not match Table 1 restated totals.',
      'Restructuring and some finance-cost items are not fully broken down across all activity areas in this table’s structure.',
      'Staff costs include non-cash pension accounting adjustments, which can materially affect year comparisons.',
      'From 2018/19, some English providers were not required to complete certain academic cost-centre breakdowns (101-145).',
      'From 2019/20, some English providers were not required to complete certain 207 research grants/contracts breakdowns.',
      'Collected as a matrix of expenditure type by activity/cost-centre and used to analyse expenditure at granular operational level.'
    ],
    columns: [
      ['UKPRN', 'Provider identifier.'],
      ['HE Provider', 'Provider name.'],
      ['Financial Year End', 'Financial year-end date.'],
      ['Academic staff costs', 'Academic staff expenditure (£000s).'],
      ['Other staff costs', 'Other staff expenditure (£000s).'],
      ['Total staff costs', 'Total staff expenditure (£000s).'],
      ['Restructuring costs', 'Restructuring expenditure (£000s).'],
      ['Other operating expenses', 'Other operating expenditure (£000s).'],
      ['Depreciation and amortisation', 'Depreciation/amortisation expenditure (£000s).'],
      ['Interest and other finance costs', 'Finance cost expenditure (£000s).'],
      ['Total expenditure', 'Total expenditure (£000s).']
    ]
  }
];
