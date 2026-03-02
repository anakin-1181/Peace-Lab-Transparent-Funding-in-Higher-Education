import { useEffect, useMemo, useState } from 'react';
import { BarChart } from '../components/BarChart';
import { PieChart } from '../components/PieChart';
import { SankeyChart } from '../components/SankeyChart';
import { ErrorView, LoadingView } from '../components/StateViews';
import { YearSelect } from '../components/YearSelect';
import { useDashboardData } from '../data/useDashboardData';
import { buildDepartmentComparison, buildDepartmentSankey } from '../lib/charts';
import { formatCurrencyK } from '../lib/format';
import type { NamedValue } from '../types';

function pieComparisonData(allDepartments: NamedValue[]): NamedValue[] {
  if (allDepartments.length <= 12) {
    return allDepartments;
  }

  const top = allDepartments.slice(0, 12);
  const otherTotal = allDepartments.slice(12).reduce((sum, row) => sum + row.value, 0);
  return [...top, { name: 'Other departments', value: otherTotal }];
}

export function DepartmentsPage() {
  const { loading, error, data } = useDashboardData();
  const [year, setYear] = useState('');
  const [departmentKey, setDepartmentKey] = useState('');

  useEffect(() => {
    if (!year && data?.table5.years.length) {
      setYear(data.table5.years[data.table5.years.length - 1]);
    }
  }, [data, year]);

  const yearData = year && data ? data.table5.byYear[year] : null;

  const comparison = useMemo(() => {
    if (!data || !year) {
      return [];
    }
    return buildDepartmentComparison(data, year);
  }, [data, year]);

  const departmentOptions = useMemo(() => {
    if (!yearData) {
      return [];
    }
    return yearData.departments
      .map((dept) => ({
        key: `${dept.code}-${dept.name}`,
        label: `${dept.code} ${dept.name}`,
        value: dept
      }))
      .sort((a, b) => b.value.total - a.value.total);
  }, [yearData]);

  useEffect(() => {
    if (!departmentOptions.length) {
      return;
    }

    const found = departmentOptions.find((opt) => opt.key === departmentKey);
    if (!found) {
      setDepartmentKey(departmentOptions[0].key);
    }
  }, [departmentOptions, departmentKey]);

  if (loading) {
    return <LoadingView text="Loading department Sankey views..." />;
  }

  if (error || !data) {
    return <ErrorView text={error ?? 'Unable to load data.'} />;
  }

  if (!yearData) {
    return <ErrorView text={`No Table 5 department data found for ${year}.`} />;
  }

  if (!departmentOptions.length) {
    return <ErrorView text={`No department rows available for ${year}.`} />;
  }

  const selected = departmentOptions.find((option) => option.key === departmentKey)?.value ?? departmentOptions[0].value;
  const sankey = buildDepartmentSankey(selected);
  const barHeight = Math.max(500, comparison.length * 20 + 120);

  return (
    <div className="page-stack">
      <section className="control-strip panel">
        <YearSelect years={data.table5.years} value={year} onChange={setYear} label="Department year" />
      </section>

      <section className="notice">
        <p>Part 1: compare all departments for selected year using exact Table 5 totals.</p>
      </section>

      <div className="chart-split chart-split-departments">
        <PieChart title="Department Share Comparison" data={pieComparisonData(comparison)} height={barHeight} compact />
        <BarChart title="Department Ranking (All Departments)" data={comparison} height={barHeight} />
      </div>

      <section className="notice">
        <p>Part 2: inspect one department in detail using exact Table 5 source-to-department flow.</p>
      </section>

      <section className="control-strip panel">
        <label className="year-select">
          <span>Department</span>
          <select value={departmentKey} onChange={(event) => setDepartmentKey(event.target.value)}>
            {departmentOptions.map((option) => (
              <option value={option.key} key={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p>
          Department total research grants (Table 5): <strong>{formatCurrencyK(selected.total)}</strong>
        </p>
      </section>

      <SankeyChart
        title={`${selected.code} ${selected.name}`}
        subtitle={`Academic year ${year}`}
        nodes={sankey.nodes}
        links={sankey.links}
        height={760}
      />
    </div>
  );
}
