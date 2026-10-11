import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DashboardItem } from '@shared/dashboard-schema';
import { appConfig } from '../../app.config';
import { DashboardStore } from './dashboard-store';

const revenueChart: DashboardItem = {
  surfaceId: 'revenue-chart',
  messages: [
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'revenue-chart',
        components: [
          {
            id: 'root',
            component: 'Image',
            url: 'https://quickchart.io/chart?c=%7B%22type%22%3A%22bar%22%7D',
          },
        ],
      },
    },
  ],
};

const productCard: DashboardItem = {
  surfaceId: 'product-card',
  messages: [
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'product-card',
        components: [
          { id: 'root', component: 'Text', text: 'Google Camp Mug Ivory' },
        ],
      },
    },
  ],
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
    store.addItem(revenueChart);
    await vi.waitFor(() => expect(store.items()).toEqual([revenueChart]));
  });

  it('keeps the items already on the dashboard', async () => {
    store.addItem(revenueChart);
    store.addItem(productCard);
    await vi.waitFor(() =>
      expect(store.items()).toEqual([revenueChart, productCard]),
    );
  });

  it('removes all items on clear', async () => {
    store.addItem(revenueChart);
    await vi.waitFor(() => expect(store.items()).toEqual([revenueChart]));
    store.clear();
    await vi.waitFor(() => expect(store.items()).toEqual([]));
  });

  it('restores the saved items on load', async () => {
    store.addItem(revenueChart);
    await vi.waitFor(() => expect(store.items()).toEqual([revenueChart]));
    store.save();
    store.clear();
    await vi.waitFor(() => expect(store.items()).toEqual([]));
    store.load();
    await vi.waitFor(() => expect(store.items()).toEqual([revenueChart]));
  });

  it('reports whether a saved state exists', async () => {
    expect(store.hasSavedState()).toBe(false);
    store.addItem(revenueChart);
    await vi.waitFor(() => expect(store.items()).toEqual([revenueChart]));
    store.save();
    expect(store.hasSavedState()).toBe(true);
  });
});
