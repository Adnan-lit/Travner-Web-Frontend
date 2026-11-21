import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { initializeApp } from './app.config';
import { getApiBaseUrl, resetRuntimeConfig } from './config/runtime.config';
import { AuthService } from './services/auth.service';

describe('app initialization', () => {
  afterEach(() => resetRuntimeConfig());

  it('loads runtime config before AuthService is constructed', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ apiBaseUrl: 'https://preview.example' }),
      } as Response),
    );
    let apiBaseUrlAtConstruction = '';

    class AuthStub {
      constructor() {
        apiBaseUrlAtConstruction = getApiBaseUrl();
      }

      initializeSession(): ReturnType<AuthService['initializeSession']> {
        return of(true);
      }
    }

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useClass: AuthStub }],
    });

    const restored = await TestBed.runInInjectionContext(() => initializeApp());

    expect(fetchSpy).toHaveBeenCalled();
    expect(apiBaseUrlAtConstruction).toBe('https://preview.example');
    expect(restored).toBeTrue();
  });
});
