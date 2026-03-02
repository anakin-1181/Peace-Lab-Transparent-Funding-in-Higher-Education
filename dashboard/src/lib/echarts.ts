import * as echarts from 'echarts/core';
import { BarChart, PieChart, SankeyChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([PieChart, SankeyChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

export { echarts };
