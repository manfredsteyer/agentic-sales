import { App, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';

interface StockResult {
  productName: string;
  stock: Record<string, number>;
}

const titleEl = document.getElementById('title')!;
const warehousesEl = document.getElementById('warehouses')!;
const totalEl = document.getElementById('total')!;

const app = new App({ name: 'Stock Widget', version: '1.0.0' });

app.ontoolinput = async ({ arguments: toolInput }) => {
  const result = await app.callServerTool({
    name: 'get-stock',
    arguments: toolInput,
  });
  render(result.structuredContent as StockResult);
};

await app.connect();

const hostContext = app.getHostContext();
if (hostContext?.styles?.variables) {
  applyHostStyleVariables(hostContext.styles.variables);
}

function render({ productName, stock }: StockResult): void {
  const entries = Object.entries(stock);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

  titleEl.textContent = `Stock: ${productName}`;
  warehousesEl.innerHTML = entries
    .map(
      ([warehouse, amount]) => `
        <li>
          <span>Warehouse ${warehouse}</span>
          <strong>${format(amount)}</strong>
          <span class="bar"><span style="width: ${amount / 10}%"></span></span>
        </li>`,
    )
    .join('');
  totalEl.textContent = format(total);
}

function format(value: number): string {
  return value.toLocaleString('en-US');
}
