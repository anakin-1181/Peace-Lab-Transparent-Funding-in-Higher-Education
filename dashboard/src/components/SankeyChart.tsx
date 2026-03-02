import ReactEChartsCore from 'echarts-for-react/lib/core';
import type { EChartsOption } from 'echarts';
import type { SankeyLink, SankeyNode } from '../types';
import { echarts } from '../lib/echarts';

type SankeyChartProps = {
  title: string;
  subtitle?: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
  onElementClick?: (name: string) => void;
  rightmostLabelsOnLeft?: boolean;
};

export function SankeyChart({
  title,
  subtitle,
  nodes,
  links,
  height = 520,
  onElementClick,
  rightmostLabelsOnLeft = false
}: SankeyChartProps) {
  const horizontalPadding = rightmostLabelsOnLeft ? '8%' : '12%';

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    color: ['#79c9ff', '#95e2b9', '#8fd6ff', '#7fd8ad'],
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}<br/>£${params.data.value.toLocaleString()}k`;
        }
        return `${params.name}`;
      }
    },
    series: [
      {
        type: 'sankey',
        nodeAlign: 'justify',
        left: horizontalPadding,
        top: 48,
        right: horizontalPadding,
        bottom: 16,
        emphasis: {
          focus: 'adjacency'
        },
        data: nodes,
        links,
        draggable: false,
        lineStyle: {
          color: 'gradient',
          curveness: 0.45,
          opacity: 0.56
        },
        itemStyle: {
          borderWidth: 0,
          color: '#79c9ff'
        },
        label: {
          color: '#ecf6ff',
          fontSize: 12,
          fontWeight: 500
        },
        levels: rightmostLabelsOnLeft
          ? [
              {
                depth: 3,
                label: {
                  position: 'left',
                  align: 'right'
                }
              }
            ]
          : undefined
      }
    ]
  };

  return (
    <section className="panel chart-panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height }}
        notMerge
        onEvents={
          onElementClick
            ? {
                click: (params: any) => {
                  if (params?.name) {
                    onElementClick(params.name);
                  }
                }
              }
            : undefined
        }
      />
    </section>
  );
}
