import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Explorer } from './explorer/explorer';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'explorer', component: Explorer },
  { path: 'dashboard', component: Dashboard },
  { path: '**', redirectTo: '' },
];
