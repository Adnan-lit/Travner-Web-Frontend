import { Route } from '@angular/router';
import { routes } from './app.routes';

describe('app routes (P3-01)', () => {
  const layout = routes.find(route => route.path === '') as Route;
  const children = layout.children ?? [];

  function child(path: string): Route {
    const route = children.find(candidate => candidate.path === path);
    expect(route).withContext(`missing child route: ${path}`).toBeDefined();
    return route as Route;
  }

  function componentName(route: Route): string {
    return (route.component as unknown as { name?: string } | undefined)?.name ?? '';
  }

  function guardNames(route: Route): string[] {
    return (route.canActivate ?? []).map(guard => (guard as unknown as { name?: string }).name ?? '');
  }

  it('routes create and detail paths to the real components', () => {
    expect(componentName(child('trips/create'))).toBe('TripCreateComponent');
    expect(componentName(child('trips/:id'))).toBe('TripDetailComponent');
    expect(componentName(child('travel-buddies/create'))).toBe('TravelBuddyCreateComponent');
    expect(componentName(child('travel-buddies/:id'))).toBe('TravelBuddyDetailComponent');
    expect(componentName(child('local-guides/create'))).toBe('LocalGuideCreateComponent');
    expect(componentName(child('local-guides/:id'))).toBe('LocalGuideDetailComponent');
    expect(componentName(child('itineraries/create'))).toBe('ItineraryCreateComponent');
  });

  it('guards routes that create or manage user-owned data', () => {
    const guardedPaths = [
      'trips/create',
      'travel-buddies/create',
      'local-guides/create',
      'itineraries/create',
      'profile',
      'settings'
    ];

    guardedPaths.forEach(path => {
      expect(guardNames(child(path))).toContain('AuthGuard');
    });
  });

  it('uses real admin analytics and settings pages instead of the dashboard', () => {
    const admin = child('admin');
    const adminChildren = admin.children ?? [];
    const analytics = adminChildren.find(route => route.path === 'analytics') as Route;
    const settings = adminChildren.find(route => route.path === 'settings') as Route;

    expect(componentName(analytics)).toBe('AdminAnalyticsComponent');
    expect(componentName(settings)).toBe('AdminSettingsComponent');
    expect(guardNames(admin)).toContain('AdminGuard');
  });

  it('renders the 404 page for unknown URLs', () => {
    const explicitNotFound = routes.find(route => route.path === '404') as Route;
    const wildcard = routes.find(route => route.path === '**') as Route;

    expect(componentName(explicitNotFound)).toBe('NotFoundComponent');
    expect(componentName(wildcard)).toBe('NotFoundComponent');
    expect(wildcard.redirectTo).toBeUndefined();
  });

  it('keeps the legacy user profile link working', () => {
    const legacy = child('user/profile');
    expect(legacy.redirectTo).toBe('profile');
    expect(legacy.pathMatch).toBe('full');
  });
});
