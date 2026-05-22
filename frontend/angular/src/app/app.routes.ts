import { Routes } from '@angular/router';
import { BookingDashboardPageComponent } from './pages/booking-dashboard/booking-dashboard.page';
import { RadarDashboardPageComponent } from './pages/radar-dashboard/radar-dashboard.page';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'radar' },
  { path: 'radar', component: RadarDashboardPageComponent },
  { path: 'booking', component: BookingDashboardPageComponent },
  { path: '**', redirectTo: 'radar' }
];
