import { Route } from '@angular/router';
import { routes } from './app.routes';

describe('app routes (P3-01/P3-02)', () => {
  const layout = routes.find(route => route.path === '') as Route;
  const children = layout.children ?? [];

  function child(path: string): Route {
    const route = children.find(candidate => candidate.path === path);
    expect(route).withContext(`missing child route: ${path}`).toBeDefined();
    return route as Route;
  }

  async function loadedComponentName(route: Route): Promise<string> {
    const loader = route.loadComponent as (() => Promise<unknown>) | undefined;
    if (!loader) {
      return '';
    }
    const resolved = await loader();
    const component = (resolved as { default?: unknown })?.default ?? resolved;
    return (component as { name?: string })?.name ?? '';
  }

  function guardNames(route: Route): string[] {
    return (route.canActivate ?? []).map(guard => (guard as unknown as { name?: string }).name ?? '');
  }

  it('routes create and detail paths to the real components', async () => {
    expect(await loadedComponentName(child('trips/create'))).toBe('TripCreateComponent');
    expect(await loadedComponentName(child('trips/:id'))).toBe('TripDetailComponent');
    expect(await loadedComponentName(child('travel-buddies/create'))).toBe('TravelBuddyCreateComponent');
    expect(await loadedComponentName(child('travel-buddies/:id'))).toBe('TravelBuddyDetailComponent');
    expect(await loadedComponentName(child('local-guides/create'))).toBe('LocalGuideCreateComponent');
    expect(await loadedComponentName(child('local-guides/:id'))).toBe('LocalGuideDetailComponent');
    expect(await loadedComponentName(child('itineraries/create'))).toBe('ItineraryCreateComponent');
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

  it('uses real admin analytics and settings pages instead of the dashboard', async () => {
    const admin = child('admin');
    const adminChildren = admin.children ?? [];
    const analytics = adminChildren.find(route => route.path === 'analytics') as Route;
    const settings = adminChildren.find(route => route.path === 'settings') as Route;

    expect(await loadedComponentName(analytics)).toBe('AdminAnalyticsComponent');
    expect(await loadedComponentName(settings)).toBe('AdminSettingsComponent');
    expect(guardNames(admin)).toContain('AdminGuard');
  });

  it('renders the 404 page for unknown URLs', async () => {
    const explicitNotFound = routes.find(route => route.path === '404') as Route;
    const wildcard = routes.find(route => route.path === '**') as Route;

    expect(await loadedComponentName(explicitNotFound)).toBe('NotFoundComponent');
    expect(await loadedComponentName(wildcard)).toBe('NotFoundComponent');
    expect(wildcard.redirectTo).toBeUndefined();
  });

  it('keeps the legacy user profile link working', () => {
    const legacy = child('user/profile');
    expect(legacy.redirectTo).toBe('profile');
    expect(legacy.pathMatch).toBe('full');
  });

  it('lazy-loads all feature pages and keeps only the layout eager', () => {
    expect(children.filter(route => route.component)).toEqual([]);
    expect((child('admin').children ?? []).filter(route => route.component)).toEqual([]);
    expect(routes.filter(route => route.loadComponent).length).toBe(4);
  });

  it('preloads only public landing routes', () => {
    ['community', 'marketplace'].forEach(path => {
      expect(child(path).data?.['preload']).toBeTrue();
    });
    expect(child('dashboard').data?.['preload']).toBeUndefined();
  });
});
