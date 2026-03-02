import { useState } from 'react';
import { Modal } from '../components/Modal';
import { PieChart } from '../components/PieChart';
import { SankeyChart } from '../components/SankeyChart';
import { ChatWidget } from '../components/ChatWidget';
import { ErrorView, LoadingView } from '../components/StateViews';
import { useDashboardData } from '../data/useDashboardData';
import {
  buildExpenditureBreakdown,
  buildOverviewModel,
  buildResearchSourceBreakdown,
  buildTuitionBreakdown
} from '../lib/charts';
import { formatCurrencyK, pct } from '../lib/format';

type DrilldownKey = 'tuition' | 'research' | 'expenditure' | null;

export function OverviewPage() {
  const { loading, error, data } = useDashboardData();
  const [drilldown, setDrilldown] = useState<DrilldownKey>(null);

  if (loading) {
    return <LoadingView text="Loading UCL dashboard data..." />;
  }

  if (error || !data) {
    return <ErrorView text={error ?? 'Unable to load data.'} />;
  }

  const year = data.table1.academicYear;
  const overview = buildOverviewModel(data);

  const tuition = buildTuitionBreakdown(data);
  const research = buildResearchSourceBreakdown(data, year);
  const expenditure = buildExpenditureBreakdown(data);

  const onChartClick = (name: string) => {
    if (name.includes('Tuition')) {
      setDrilldown('tuition');
      return;
    }

    if (name.includes('Research grants and contracts')) {
      setDrilldown('research');
      return;
    }

    if (
      name.includes('expenditure') ||
      name.includes('Staff costs') ||
      name.includes('Restructuring') ||
      name.includes('Depreciation') ||
      name.includes('Interest') ||
      name.includes('Other operating')
    ) {
      setDrilldown('expenditure');
    }
  };

  const researchShare = overview.totalIncome > 0 ? overview.income.find((item) => item.name === 'Research grants and contracts')!.value / overview.totalIncome : 0;

  return (
    <div className="page-stack">
      <section className="control-strip panel">
        <p>
          Overview year (Table 1): <strong>{year}</strong>
        </p>
        <p>
          Provider: <strong>{data.provider.name}</strong> ({data.provider.ukprn})
        </p>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <h3>Total income</h3>
          <p>{formatCurrencyK(overview.totalIncome)}</p>
        </article>
        <article className="metric-card">
          <h3>Total expenditure</h3>
          <p>{formatCurrencyK(overview.totalExpenditure)}</p>
        </article>
        <article className="metric-card">
          <h3>Net position</h3>
          <p className={overview.netPosition >= 0 ? 'positive' : 'negative'}>{formatCurrencyK(overview.netPosition)}</p>
        </article>
        <article className="metric-card">
          <h3>Research share of income</h3>
          <p>{pct(researchShare)}</p>
        </article>
      </section>

      <ChatWidget data={data} />

      <SankeyChart
        title="UCL Income to Expenditure Flow"
        subtitle="Click tuition, research, or expenditure nodes for detailed drill-down charts"
        nodes={overview.nodes}
        links={overview.links}
        height={760}
        rightmostLabelsOnLeft
        onElementClick={onChartClick}
      />

      {drilldown === 'tuition' ? (
        <Modal title={`Tuition Detail (${data.table6.academicYear})`} onClose={() => setDrilldown(null)}>
          <PieChart title="Table 6: UK vs Non-UK + Other Fee Components" data={tuition} height={380} />
        </Modal>
      ) : null}

      {drilldown === 'research' ? (
        <Modal title={`Research Grants Detail (${year})`} onClose={() => setDrilldown(null)}>
          {research.length > 0 ? (
            <PieChart title="Table 5: Research Grants by Source" data={research} height={380} />
          ) : (
            <div className="empty-view">No Table 5 research source data for {year}.</div>
          )}
        </Modal>
      ) : null}

      {drilldown === 'expenditure' ? (
        <Modal title={`Expenditure Detail (${data.table8.academicYear})`} onClose={() => setDrilldown(null)}>
          <PieChart title="Table 8: Expenditure Breakdown" data={expenditure} height={380} />
        </Modal>
      ) : null}
    </div>
  );
}
