# Solution

## TODO #1: Define the bar schema and the `bars` prop

File: `src/app/agents/sales/widgets/bar-chart-schema.ts`

Replace the TODO in `barSchema` with the three fields:

```ts
const barSchema = z.object({
  label: z.string(),
  series: z
    .string()
    .nullish()
    .describe('Value of the second dimension for grouped bars, e.g. "Europe"'),
  value: z.number(),
});
```

Replace the TODO in `barChartSchema` with the `bars` array:

```ts
export const barChartSchema = z.object({
  title: z.string().describe('Short title, e.g. "Revenue per week"'),
  valueLabel: z.string().describe('What the values are, e.g. "Revenue (USD)"'),
  bars: z.array(barSchema).min(1).describe(`
    One bar per aggregate row, e.g. { "label": "2020-W50", "value": 59842 }. With a second
    dimension, add its value as series: { "label": "Apparel", "series": "Europe", "value": 21530 }
  `),
});
```

## TODO #2: Implement the bar chart widget

File: `src/app/agents/sales/widgets/bar-chart-widget.ts`

Extend the imports:

```ts
import { Component, computed, input } from '@angular/core';
import {
  type AngularToolCall,
  type RegisterComponentConfig,
  type ToolRenderer,
} from '@copilotkit/angular';
```

Use the template from the comment at the end of the file and delete the
comment afterwards:

```ts
template: `
  @let call = toolCall();
  <div class="not-prose">
    @if (hasValidArgs() && call.status !== 'in-progress') {
      <app-bar-chart [data]="call.args" />
    } @else if (call.status === 'complete') {
      <p class="hint">
        Can't show this chart: the agent passed incomplete data.
      </p>
    } @else {
      <app-loading-indicator>Creating chart …</app-loading-indicator>
    }
  </div>
`,
```

Implement `ToolRenderer<BarChartArgs>`, add the `toolCall` input and check the
args with the existing `isValid` function:

```ts
export class BarChartWidget implements ToolRenderer<BarChartArgs> {
  readonly toolCall = input.required<AngularToolCall<BarChartArgs>>();

  protected readonly hasValidArgs = computed(() =>
    isValid(this.toolCall().args),
  );
}
```

Replace the empty `barChartWidget` object with the registration config:

```ts
export const barChartWidget: RegisterComponentConfig<BarChartArgs> = {
  name: 'barChart',
  description: `
    Shows values of one or two dimensions as a bar chart in the chat. Use it for comparisons
    and trends, e.g. revenue per week or per country. For two dimensions, pass the second
    one as series: the bars are grouped per label with one color per series (at most 8).
  `,
  parameters: barChartSchema,
  component: BarChartWidget,
};
```

## TODO #3: Register the components and the frontend tool

File: `src/app/agents/sales/sales-agent.ts`

Add the imports:

```ts
import { registerComponent, registerFrontendTool } from '@copilotkit/angular';
import { explorerTool } from './tools/explorer-tool';
import { barChartWidget } from './widgets/bar-chart-widget';
import { pieChartWidget } from './widgets/pie-chart-widget';
import { pivotTableWidget } from './widgets/pivot-table-widget';
```

Replace both TODOs in `initSalesAgent` with:

```ts
registerComponent({ ...barChartWidget, agentId: SALES_AGENT_ID });
registerComponent({ ...pieChartWidget, agentId: SALES_AGENT_ID });
registerComponent({ ...pivotTableWidget, agentId: SALES_AGENT_ID });
registerFrontendTool({ ...explorerTool, agentId: SALES_AGENT_ID });
```

## TODO #4: Provide CopilotKit and the sales agent

File: `src/app/app.config.ts`

Add the imports:

```ts
import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideCopilotKit } from '@copilotkit/angular';
import { initSalesAgent } from './agents/sales/sales-agent';
```

Replace the two `#4` TODOs in `providers` with:

```ts
provideCopilotKit({
  defaultToolRendering: true,
  enableInspector: false,
}),
provideAppInitializer(initSalesAgent),
```

## TODO #5: Add the chat widget

File: `src/app/feature-sales/sales-chat.html`

Replace the TODO at the top of the file with:

```html
<copilot-chat [agentId]="agentId" />
```

`CopilotChat` is already imported in `sales-chat.ts`.

## TODO #7: Implement the dashboard widget

File: `src/app/agents/dashboard/widgets/dashboard-widget.ts`

Implement `ToolRenderer<RunQueryArgs>` and type the input:

```ts
export class DashboardWidget implements ToolRenderer<RunQueryArgs> {
  readonly toolCall = input.required<AngularToolCall<RunQueryArgs>>();
```

Replace the empty `dashboardWidget` object at the end of the file with the
config and move it below the class, as `main` does. The properties are called
`name`, `args` and `component`, not `toolName` and `schema` as the TODO says:

```ts
export const dashboardWidget: RenderToolCallConfig<RunQueryArgs> = {
  name: 'runQuery',
  args: runQuerySchema,
  component: DashboardWidget,
};
```

The type imports are already there.

## TODO #8: Register the tool call renderer and provide the dashboard agent

File: `src/app/agents/dashboard/dashboard-agent.ts`

Add the imports:

```ts
import { registerRenderToolCall } from '@copilotkit/angular';
import { dashboardWidget } from './widgets/dashboard-widget';
```

Replace the TODO after `registerAgent` with:

```ts
registerRenderToolCall({
  ...dashboardWidget,
  agentId: DASHBOARD_AGENT_ID,
});
```

File: `src/app/app.config.ts`

Import the initializer:

```ts
import { initDashboardAgent } from './agents/dashboard/dashboard-agent';
```

Replace the TODO below `provideAppInitializer(initSalesAgent)` with:

```ts
provideAppInitializer(initDashboardAgent),
```

## TODO #9: Add the chat widget to the dashboard

File: `src/app/feature-dashboard/dashboard-view/dashboard-view.html`

Replace the TODO in the chat panel, between the header and the examples, with:

```html
<copilot-chat [agentId]="agentId" />
```

`CopilotChat` is already imported in `dashboard-view.ts`.

## TODO #10: Connect the dashboard to the agent state

File: `src/app/agents/dashboard/dashboard-agent.ts`

Import the initial state:

```ts
import { initialDashboard } from '@shared/dashboard-schema';
```

Assign it in `registerAgent`:

```ts
registerAgent({
  agentId: DASHBOARD_AGENT_ID,
  url: `http://localhost:4111/ag-ui/${DASHBOARD_AGENT_ID}`,
  initialState: initialDashboard,
});
```

File: `src/app/feature-dashboard/dashboard-store/dashboard-store.ts`

Add the imports:

```ts
import { injectAgentStore } from '@copilotkit/angular';
import { DASHBOARD_AGENT_ID } from '../../agents/dashboard/dashboard-agent';
```

Inject the agent store and project `state` to the agent state:

```ts
private readonly agentStore = injectAgentStore(DASHBOARD_AGENT_ID);

readonly state = computed(() => this.agentStore().state() as Dashboard);
```

Add the item to the agent state in `addItem`:

```ts
addItem(item: DashboardItem): void {
  const agent = this.agentStore().agent;
  const state: Dashboard = agent.state;
  agent.setState({ items: [...state.items, item] });
}
```

File: `src/app/feature-dashboard/dashboard-view/dashboard-view.ts`

`store` and `items` are already in place. Project `hasSavedState` to the store:

```ts
protected readonly hasSavedState = computed(() => this.store.hasSavedState());
```

In `main`, the template reads `store.items()` and `store.hasSavedState()`
directly instead of these two computeds. `main` also has `save`, `load` and
`clear` in the store, plus the Load, Save and Clear buttons in the header.
They aren't part of the starter.

## TODO #11: Iterate the items and call `app-dashboard-tile`

File: `src/app/feature-dashboard/dashboard-view/dashboard-view.html`

Replace the TODO inside `<div class="tiles">` with:

```html
@for (item of items(); track item.id) {
<app-dashboard-tile [spec]="item.spec" />
} @empty {
<div class="empty card">
  <span class="empty-icon" aria-hidden="true">
    <img src="icons/grid-plus.svg" width="22" height="22" alt="" />
  </span>
  <p class="empty-title">No tiles yet</p>
  <p class="hint">
    Ask the assistant for a chart or table and click “Add to dashboard”.
  </p>
</div>
}
```

`DashboardTile` is already imported in `dashboard-view.ts`.
