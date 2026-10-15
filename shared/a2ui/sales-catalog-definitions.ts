import { barChartSchema } from './bar-chart-schema';
import { pieChartSchema } from './pie-chart-schema';
import { pivotTableSchema } from './pivot-table-schema';

export const SALES_CATALOG_ID =
  'https://angulararchitects.io/a2ui/sales-catalog.json';

// as never: our zod/v3 types clash with the zod 3 copies of CopilotKit and web_core
export const salesCatalogDefinitions = {
  // TODO #6: Add entry for ProductCarousel and productCarouselSchema

  BarChart: { props: barChartSchema as never },
  PieChart: { props: pieChartSchema as never },
  PivotTable: { props: pivotTableSchema as never },
};
