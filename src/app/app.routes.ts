import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminSetupComponent } from './components/admin-setup.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'admin-setup', component: AdminSetupComponent },
  { path: '**', redirectTo: '' } // Wildcard route for 404 pages
];
