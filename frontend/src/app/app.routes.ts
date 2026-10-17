import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'login', loadComponent: () => import('./features/auth/auth.page').then((page) => page.AuthPageComponent) },
  { path: 'overview', canActivate: [authGuard], loadComponent: () => import('./features/overview/overview.page').then((page) => page.OverviewPageComponent) },
  { path: 'portfolio', canActivate: [authGuard], loadComponent: () => import('./features/portfolio/portfolio.page').then((page) => page.PortfolioPageComponent) },
  { path: 'markets', canActivate: [authGuard], loadComponent: () => import('./features/markets/markets.page').then((page) => page.MarketsPageComponent) },
  { path: 'analysis', canActivate: [authGuard], loadComponent: () => import('./features/analysis/analysis.page').then((page) => page.AnalysisPageComponent) },
  { path: 'risk', canActivate: [authGuard], loadComponent: () => import('./features/risk/risk.page').then((page) => page.RiskPageComponent) },
  { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./features/orders/orders.page').then((page) => page.OrdersPageComponent) },
  { path: '**', redirectTo: 'overview' },
];
