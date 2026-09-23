import { Agent } from '@mastra/core/agent';

import { executeJavaScript } from '../tools/execute-javascript';
import { type Column, getSchema } from '../tools/sales-api';
import { aggregateSales, getSalesDetails } from '../tools/sales-tools';
import { salesAgentPrompt } from './sales-agent.prompt';

export const salesAgent = new Agent({
  id: 'sales-agent',
  name: 'Sales Analyst',
  instructions: async () => {
    const { columns } = await getSchema();
    const columnList = columns.map(toColumnLine).join('\n');
    return `${salesAgentPrompt}\nColumns of the sales table:\n${columnList}\n`;
  },
  model: 'openai/gpt-5.6-terra',
  tools: { aggregateSales, getSalesDetails, executeJavaScript },
});

function toColumnLine(column: Column): string {
  const count = column.examples ? `, ${column.distinctCount} values` : '';
  const description = column.description ? `: ${column.description}` : '';
  return `- ${column.name} (${column.type}${count})${description}${toValueList(column)}`;
}

function toValueList(column: Column): string {
  if (column.values) {
    return `. Values: ${column.values.map((value) => JSON.stringify(value)).join(', ')}`;
  }
  if (column.examples) {
    return `. E.g. ${column.examples.map((value) => JSON.stringify(value)).join(', ')}`;
  }
  return '';
}
