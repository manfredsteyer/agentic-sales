import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../app.config';
import { DashboardItem } from './dashboard-model';
import { DashboardStore } from './dashboard-store';

const barChart: DashboardItem = {
  id: 'bar',
  title: 'Revenue per month',
  kind: 'barChart',
  args: {
    title: 'Revenue per month',
    valueLabel: 'Revenue (USD)',
    bars: [{ label: '2020-11', value: 143000 }],
  },
};

const pieChart: DashboardItem = {
  id: 'pie',
  title: 'Revenue per device',
  kind: 'pieChart',
  args: {
    title: 'Revenue per device',
    valueLabel: 'Revenue (USD)',
    slices: [{ label: 'desktop', value: 250000 }],
  },
};

describe('DashboardStore', () => {
  let store: DashboardStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    store = TestBed.inject(DashboardStore);
  });

  it('appends the item to the dashboard', async () => {
    store.addItem(barChart);
    await vi.waitFor(() => expect(store.items()).toEqual([barChart]));
  });

  it('keeps the items already on the dashboard', async () => {
    store.addItem(barChart);
    store.addItem(pieChart);
    await vi.waitFor(() =>
      expect(store.items().map((item) => item.id)).toEqual(['bar', 'pie']),
    );
  });

  it('removes all items on clear', async () => {
    store.addItem(barChart);
    await vi.waitFor(() => expect(store.items()).toEqual([barChart]));
    store.clear();
    await vi.waitFor(() => expect(store.items()).toEqual([]));
  });
});
