export type NamedValue = {
  name: string;
  value: number;
};

export type DepartmentBreakdown = {
  code: string;
  name: string;
  total: number;
  sources: NamedValue[];
};

export type Table5YearData = {
  researchTotal: number;
  sources: NamedValue[];
  departments: DepartmentBreakdown[];
};

export type Table1YearData = {
  ukprn: string;
  provider: string;
  financialYearEnd: string;
  academicYear: string;
  tuitionFeesAndEducationContracts: number;
  fundingBodyGrants: number;
  researchGrantsAndContracts: number;
  otherIncome: number;
  investmentIncome: number;
  donationsAndEndowments: number;
  totalIncome: number;
  staffCosts: number;
  restructuringCosts: number;
  otherOperatingExpenses: number;
  depreciationAndAmortisation: number;
  interestAndOtherFinanceCosts: number;
  totalExpenditure: number;
};

export type Table6YearData = {
  ukprn: string;
  provider: string;
  financialYearEnd: string;
  academicYear: string;
  totalHomeFees: number;
  totalRestOfUkFees: number;
  totalUkFees: number;
  totalEuFees: number;
  totalUkAndEuFees: number;
  totalNonEuFees: number;
  totalNonUkFees: number;
  totalHeCourseFees: number;
  totalResearchTrainingSupportGrants: number;
  nonCreditBearingCourseFees: number;
  feCourseFees: number;
  totalTuitionFeesAndEducationContracts: number;
  contractedOutActivityFeeIncome: number;
};

export type Table8YearData = {
  ukprn: string;
  provider: string;
  financialYearEnd: string;
  academicYear: string;
  academicStaffCosts: number;
  otherStaffCosts: number;
  totalStaffCosts: number;
  restructuringCosts: number;
  otherOperatingExpenses: number;
  depreciationAndAmortisation: number;
  interestAndOtherFinanceCosts: number;
  totalExpenditure: number;
};

export type DashboardData = {
  generatedAt: string;
  provider: {
    ukprn: string;
    name: string;
  };
  notes: {
    overviewBaselineYear: string;
    overviewMethod: string;
  };
  table1: {
    years: string[];
    byYear: Record<string, Table1YearData>;
  };
  table6: {
    years: string[];
    byYear: Record<string, Table6YearData>;
  };
  table8: {
    years: string[];
    byYear: Record<string, Table8YearData>;
  };
  table5: {
    years: string[];
    byYear: Record<string, Table5YearData>;
  };
};

export type SankeyNode = {
  name: string;
};

export type SankeyLink = {
  source: string;
  target: string;
  value: number;
};
