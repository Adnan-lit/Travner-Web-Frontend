import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { PostListComponent } from './components/posts/post-list.component';
import { PostDetailComponent } from './components/posts/post-detail/post-detail.component';
import { PostEditComponent } from './components/posts/post-edit/post-edit.component';
import { PostCreateComponent } from './components/posts/post-create/post-create.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { postOwnerGuard } from './guards/post-owner.guard';
import { ChatComponent } from './components/chat/chat.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
      { path: 'community', component: PostListComponent },
      { path: 'community/new', component: PostCreateComponent, canActivate: [authGuard] },
      { path: 'community/:id', component: PostDetailComponent },
      { path: 'community/:id/edit', component: PostEditComponent, canActivate: [authGuard, postOwnerGuard] },
      { path: 'posts', redirectTo: 'community', pathMatch: 'full' },
      { path: 'posts/:id', redirectTo: 'community/:id', pathMatch: 'full' },
      { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
      { path: 'chat/:id', component: ChatComponent, canActivate: [authGuard] },
    ]
  },
  { path: 'signin', component: SigninComponent, canActivate: [noAuthGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [noAuthGuard] },
  { path: '**', redirectTo: '' } // Wildcard route for 404 pages
];
