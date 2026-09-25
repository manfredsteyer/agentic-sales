const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

export function formatValue(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? numberFormat.format(n) : '–';
}
