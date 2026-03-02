import ReactEChartsCore from 'echarts-for-react/lib/core';
import type { EChartsOption } from 'echarts';
import { echarts } from '../lib/echarts';
import type { NamedValue } from '../types';

type BarChartProps = {
  title: string;
  data: NamedValue[];
  height?: number;
};

export function BarChart({ title, data, height = 520 }: BarChartProps) {
  const categories = data.map((item) => item.name);
  const values = data.map((item) => item.value);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const first = params?.[0];
        if (!first) {
          return '';
        }
        return `${first.name}<br/>£${first.value.toLocaleString()}k`;
      }
    },
    grid: {
      top: 18,
      right: 44,
      bottom: 18,
      left: 96,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#f0f0f0',
        formatter: (value: number) => `£${value.toLocaleString()}k`
      },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } }
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: '#f0f0f0',
        width: 136,
        overflow: 'truncate'
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barMaxWidth: 16,
        itemStyle: {
          color: '#79c9ff',
          borderRadius: [0, 4, 4, 0]
        },
        emphasis: {
          itemStyle: {
            color: '#95e2b9'
          }
        }
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
