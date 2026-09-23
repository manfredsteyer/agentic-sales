import { toDashboardItems, withItem } from './dashboard-state';

const bars = {
  title: 'Revenue per month',
  valueLabel: 'Revenue (USD)',
  bars: [{ label: '2020-11', value: 143000 }],
};

const slices = {
  title: 'Revenue per device',
  valueLabel: 'Revenue (USD)',
  slices: [{ label: 'desktop', value: 250000 }],
};

describe('dashboard state', () => {
  it('appends an item with an id and the title of the chart', () => {
    const state = withItem(undefined, 'barChart', bars);
    expect(state.items.length).toBe(1);
    expect(state.items[0].id).toBeTruthy();
    expect(state.items[0].title).toBe('Revenue per month');
  });

  it('keeps the items already in the state', () => {
    const state = withItem(withItem(undefined, 'barChart', bars), 'pieChart', slices);
    expect(toDashboardItems(state).map((item) => item.kind)).toEqual(['barChart', 'pieChart']);
  });

  it('reads no items from a state without a valid dashboard', () => {
    expect(toDashboardItems(undefined)).toEqual([]);
    expect(toDashboardItems({ items: [{ kind: 'barChart' }] })).toEqual([]);
  });
});
