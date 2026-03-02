import ReactEChartsCore from 'echarts-for-react/lib/core';
import type { EChartsOption } from 'echarts';
import type { NamedValue } from '../types';
import { echarts } from '../lib/echarts';

type PieChartProps = {
  title: string;
  data: NamedValue[];
  height?: number;
  compact?: boolean;
};

export function PieChart({ title, data, height = 420, compact = false }: PieChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}<br/>£${params.value.toLocaleString()}k (${params.percent}%)`
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      top: 'middle',
      right: 8,
      itemGap: 10,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#ecf6ff', width: 165, overflow: 'truncate' }
    },
    series: [
      {
        type: 'pie',
        radius: compact ? ['28%', '50%'] : ['40%', '70%'],
        center: ['34%', '50%'],
        padAngle: 1,
        itemStyle: {
          borderColor: '#090909',
          borderWidth: 2
        },
        label: {
          show: false
        },
        color: ['#79c9ff', '#95e2b9', '#9ad7ff', '#7fd8ad', '#68b8f0', '#6bc49f', '#a8e6c8', '#8fcaf2'],
        data
      }
    ]
  };

  return (
    <section className="panel chart-panel">
      <div className="panel-head">
        <h2>{title}</h2>
      </div>
      <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />
    </section>
  );
}
