import { SelectivePreloadingStrategy } from './selective-preloading.strategy';
import { of } from 'rxjs';

describe('SelectivePreloadingStrategy', () => {
  const strategy = new SelectivePreloadingStrategy();

  it('preloads routes marked for preloading', (done) => {
    const load = jasmine.createSpy('load').and.returnValue(of('loaded'));

    strategy.preload({ path: 'community', data: { preload: true } }, load).subscribe({
      complete: () => {
        expect(load).toHaveBeenCalled();
        done();
      },
    });
  });

  it('skips routes that are not marked', (done) => {
    const load = jasmine.createSpy('load').and.returnValue(of('loaded'));

    strategy.preload({ path: 'chat' }, load).subscribe({
      complete: () => {
        expect(load).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
