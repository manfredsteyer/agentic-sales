import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { DashboardItem } from './dashboard-model';
import { DashboardStore } from './dashboard-store';

const barChart: DashboardItem = {
  id: 'bar',
  spec: {
    kind: 'barChart',
    title: 'Revenue per month',
    valueLabel: 'Revenue (USD)',
    expression: `$aggregate({ "fact": "Revenue", "aggregateFn": "sum", "dimensions": ["Month"] }).{ "label": Month, "value": value }[]`,
  },
};

const pieChart: DashboardItem = {
  id: 'pie',
  spec: {
    kind: 'pieChart',
    title: 'Revenue per device',
    valueLabel: 'Revenue (USD)',
    expression: `$aggregate({ "fact": "Revenue", "aggregateFn": "sum", "dimensions": ["DeviceCategory"] }).{ "label": DeviceCategory, "value": value }[]`,
  },
};

describe('DashboardStore', () => {
  let store: DashboardStore;

  beforeEach(async () => {
    localStorage.clear();
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

  it('restores the saved items on load', async () => {
    store.addItem(barChart);
    await vi.waitFor(() => expect(store.items()).toEqual([barChart]));
    store.save();
    store.clear();
    await vi.waitFor(() => expect(store.items()).toEqual([]));
    store.load();
    await vi.waitFor(() => expect(store.items()).toEqual([barChart]));
  });

  it('reports whether a saved state exists', async () => {
    expect(store.hasSavedState()).toBe(false);
    store.addItem(barChart);
    await vi.waitFor(() => expect(store.items()).toEqual([barChart]));
    store.save();
    expect(store.hasSavedState()).toBe(true);
  });
});
