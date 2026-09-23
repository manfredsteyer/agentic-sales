import { Routes } from '@angular/router';

import { Dashboard } from './dashboard/dashboard';
import { Explore } from './explore/explore';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'explore', component: Explore },
  { path: 'dashboard', component: Dashboard },
  { path: '**', redirectTo: '' },
];
