import { Routes } from '@angular/router';
import { DashboardView } from './feature-dashboard/dashboard-view/dashboard-view';
import { Explorer } from './feature-explorer/explorer';
import { SalesChat } from './feature-sales/sales-chat';

export const routes: Routes = [
  { path: '', component: SalesChat },
  { path: 'explorer', component: Explorer },
  { path: 'dashboard', component: DashboardView },
  { path: '**', redirectTo: '' },
];
