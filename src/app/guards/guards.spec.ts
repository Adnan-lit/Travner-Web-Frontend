import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { User } from '../models/common.model';
import { AuthService } from '../services/auth.service';
import { AdminGuard } from './admin.guard';
import { AuthGuard } from './auth.guard';
import { NoAuthGuard } from './no-auth.guard';
import { PostOwnerGuard } from './post-owner.guard';

describe('route guards', () => {
  let currentUser$: BehaviorSubject<User | null>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated'], {
      currentUser$: currentUser$.asObservable(),
    });
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  it('AuthGuard allows an authenticated user', async () => {
    currentUser$.next({ id: 'u1', userName: 'alice' } as User);

    expect(await firstValueFrom(new AuthGuard(authService, router).canActivate(route, state))).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('AuthGuard redirects an anonymous user with the return URL', async () => {
    expect(await firstValueFrom(new AuthGuard(authService, router).canActivate(route, state))).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/signin'], { queryParams: { returnUrl: '/dashboard' } });
  });

  it('AdminGuard allows only an ADMIN user', async () => {
    currentUser$.next({ id: 'u1', userName: 'alice', roles: ['ADMIN'] } as User);
    expect(await firstValueFrom(new AdminGuard(authService, router).canActivate())).toBeTrue();

    currentUser$.next({ id: 'u2', userName: 'bob', roles: ['USER'] } as User);
    expect(await firstValueFrom(new AdminGuard(authService, router).canActivate())).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('AdminGuard redirects anonymous users to signin', async () => {
    expect(await firstValueFrom(new AdminGuard(authService, router).canActivate())).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('NoAuthGuard keeps anonymous users on auth pages and redirects signed-in users', async () => {
    const guard = new NoAuthGuard(authService, router);
    expect(await firstValueFrom(guard.canActivate(route, state))).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();

    currentUser$.next({ id: 'u1', userName: 'alice', roles: ['ADMIN'] } as User);
    expect(await firstValueFrom(guard.canActivate(route, state))).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('PostOwnerGuard requires authentication but does not pretend to own-check', async () => {
    authService.isAuthenticated.and.returnValue(false);
    const guard = new PostOwnerGuard(authService, router);
    expect(
      await firstValueFrom(guard.canActivate({ params: { id: 'p1' } } as unknown as ActivatedRouteSnapshot)),
    ).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/signin']);

    authService.isAuthenticated.and.returnValue(true);
    expect(
      await firstValueFrom(guard.canActivate({ params: { id: 'p1' } } as unknown as ActivatedRouteSnapshot)),
    ).toBeTrue();
  });
});
